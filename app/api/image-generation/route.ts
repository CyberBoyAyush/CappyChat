import { NextRequest, NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits } from '@/lib/tierSystem';
import { prodError } from '@/lib/logger';
import { CloudinaryService } from '@/lib/cloudinary';
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  logCreditConsumption,
  flushLogs,
} from '@/lib/betterstack-logger';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger('image-generation');

  // Declare variables outside try block for error handling
  let userId: string | undefined;
  let model: string | undefined;

  try {
    const body = await req.json();
    const {
      prompt,
      model: requestModel,
      userId: requestUserId,
      isGuest,
      userApiKey,
      width = 1024,
      height = 1024,
      attachments = [],
      conversationHistory = []
    } = body;

    // Assign to outer scope variables
    userId = requestUserId;
    model = requestModel;

    // Log request start
    await logApiRequestStart(logger, '/api/image-generation', {
      userId: userId || 'guest',
      model,
      isGuest: !!isGuest,
      dimensions: `${width}x${height}`,
      hasConversationHistory: conversationHistory.length > 0,
    });

    // Validate required fields
    if (!prompt || !model) {
      await logValidationError(logger, '/api/image-generation', 'prompt/model', 'Prompt and model are required');
      await flushLogs(logger);
      return NextResponse.json(
        { error: 'Prompt and model are required' },
        { status: 400 }
      );
    }

    // Skip tier validation for guest users
    if (!isGuest) {
      // Check tier validation for image generation models
      const usingBYOK = !!userApiKey;
      const tierValidation = await canUserUseModel(model as any, usingBYOK, userId, isGuest);

      if (!tierValidation.canUseModel) {
        return NextResponse.json(
          {
            error: tierValidation.message || 'Model access denied',
            code: 'TIER_LIMIT_EXCEEDED'
          },
          { status: 403 }
        );
      }
    }

    // Get OpenRouter API key
    const openrouterApiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Image generation service not configured' },
        { status: 500 }
      );
    }

    console.log(`🎨 Generating image with model: ${model}`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`📐 Dimensions: ${width}x${height}`);
    console.log(`💬 Conversation history: ${conversationHistory.length} messages`);

    // Prepare messages for OpenRouter with conversation history
    const messages: any[] = [];

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      console.log('📜 Processing conversation history:', conversationHistory.map((m: any) => ({
        role: m.role,
        hasContent: !!m.content,
        hasImage: !!m.imgurl,
        contentPreview: m.content?.substring(0, 50)
      })));

      // Find the most recent image in conversation history (for modifications like "make it red")
      let mostRecentImageUrl: string | null = null;
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        if (conversationHistory[i].imgurl) {
          mostRecentImageUrl = conversationHistory[i].imgurl;
          if (mostRecentImageUrl) {
            console.log('🖼️ Found most recent image for context:', mostRecentImageUrl.substring(0, 100));
          }
          break;
        }
      }

      // Only include text prompts from history (last 3 user prompts for context)
      const userPrompts = conversationHistory
        .filter((m: any) => m.role === 'user' && m.content && !m.content.includes('[aspectRatio:'))
        .slice(-3);

      for (const historyMsg of userPrompts) {
        messages.push({
          role: 'user',
          content: historyMsg.content
        });
      }

      // If there's a recent image and the current prompt seems like a modification request
      const lowerPrompt = prompt.toLowerCase();
      const modificationKeywords = [
        'make it', 'make the', 'change', 'modify', 'alter', 'turn it', 'turn the',
        'add', 'add a', 'put', 'include', 'remove', 'delete', 'take away',
        'color', 'paint', 'blue', 'red', 'green', 'yellow', 'purple', 'orange',
        'bigger', 'smaller', 'darker', 'lighter', 'brighter'
      ];

      const isModificationRequest = modificationKeywords.some((keyword: string) => lowerPrompt.includes(keyword));

      if (mostRecentImageUrl && isModificationRequest) {
        console.log('🎨 Detected modification request, including recent image');
        // Add the most recent image before the current prompt
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'Modify this image:' },
            { type: 'image_url', image_url: { url: mostRecentImageUrl } }
          ]
        });
      }
    }

    // Add current user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    // Add image attachments to current message if provided (for image-to-image generation)
    if (attachments && attachments.length > 0) {
      console.log(`🖼️ Image-to-image mode with ${attachments.length} reference image(s)`);
      const imageUrls = attachments.map((attachment: any) => attachment.url).filter(Boolean);

      if (imageUrls.length > 0) {
        // Update the last message (current user prompt) to include attachments
        const lastMessage = messages[messages.length - 1];
        lastMessage.content = [
          { type: 'text', text: prompt },
          ...imageUrls.map((url: string) => ({
            type: 'image_url',
            image_url: { url }
          }))
        ];
      }
    }

    // Log final messages structure
    console.log('📨 Sending to OpenRouter:', JSON.stringify({
      messageCount: messages.length,
      messages: messages.map(m => ({
        role: m.role,
        contentType: typeof m.content,
        isArray: Array.isArray(m.content),
        hasImage: Array.isArray(m.content) ? m.content.some((c: any) => c.type === 'image_url') : false
      }))
    }, null, 2));

    // Call OpenRouter API with image generation modalities
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        'X-Title': 'AtChat'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages,
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Image generation completed`);

    // Extract the generated image from the response
    const message = result.choices?.[0]?.message;
    console.log('📦 Response structure:', {
      hasMessage: !!message,
      hasImages: !!message?.images,
      imageCount: message?.images?.length,
      hasContent: !!message?.content
    });

    // Try multiple paths to extract the image
    let imageUrl = null;

    if (message?.images && message.images.length > 0) {
      // Path 1: message.images[0].image_url.url (documented format)
      imageUrl = message.images[0].image_url?.url || message.images[0].url;
      console.log('✅ Found image in images array');
    } else if (message?.content && Array.isArray(message.content)) {
      // Path 2: Check content array for image_url type
      const imagePart = message.content.find((part: any) => part.type === 'image_url');
      if (imagePart?.image_url?.url) {
        imageUrl = imagePart.image_url.url;
        console.log('✅ Found image in content array');
      }
    }

    if (!imageUrl) {
      console.error('❌ Image not found. Message:', JSON.stringify(message, null, 2));
      return NextResponse.json(
        { error: 'Failed to generate image - no image data in response' },
        { status: 500 }
      );
    }

    console.log('🖼️ Image URL type:', imageUrl.startsWith('data:') ? 'base64' : 'url');
    console.log('🖼️ Image URL length:', imageUrl.length);

    // Upload base64 image to Cloudinary to get a permanent URL
    let finalImageUrl = imageUrl;
    if (imageUrl.startsWith('data:')) {
      console.log('📤 Uploading base64 image to Cloudinary...');
      const uploadResult = await CloudinaryService.uploadBase64Image(
        imageUrl,
        `${model.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
      );

      if (uploadResult.success && uploadResult.url) {
        finalImageUrl = uploadResult.url;
        console.log('✅ Image uploaded to Cloudinary:', finalImageUrl);
      } else {
        console.error('❌ Failed to upload to Cloudinary, using base64 URL');
        // Continue with base64 URL as fallback
      }
    }

    // Consume credits for non-guest users
    if (!isGuest && userId) {
      try {
        await consumeCredits(model as any, false, userId, isGuest);
        console.log(`💳 Credits consumed for user ${userId} using model ${model}`);
        await logCreditConsumption(logger, {
          userId,
          model,
          dimensions: `${width}x${height}`,
        });
      } catch (error) {
        console.error('Failed to consume credits:', error);
      }
    }

    // Log success
    await logApiRequestSuccess(logger, '/api/image-generation', {
      userId: userId || 'guest',
      model,
      dimensions: `${width}x${height}`,
      imageUploaded: finalImageUrl !== imageUrl,
    });
    await flushLogs(logger);

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      model: model,
      prompt: prompt,
      dimensions: { width, height }
    });

  } catch (error) {
    prodError('Image generation error', error, 'ImageGenerationAPI');

    // Log error
    await logApiRequestError(logger, '/api/image-generation', error, {
      userId: userId || 'unknown',
      model: model || 'unknown',
    });
    await flushLogs(logger);

    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid API key for image generation service' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Image generation quota exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}
