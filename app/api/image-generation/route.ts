import { NextRequest, NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits } from '@/lib/tierSystem';
import { Runware } from '@runware/sdk-js';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      model, 
      userId, 
      isGuest, 
      userApiKey,
      width = 1024,
      height = 1024,
      numberResults = 1
    } = body;

    // Validate required fields
    if (!prompt || !model) {
      return NextResponse.json(
        { error: 'Prompt and model are required' },
        { status: 400 }
      );
    }

    // Skip tier validation for guest users
    if (!isGuest) {
      // Check tier validation for image generation models
      const usingBYOK = !!userApiKey;
      const tierValidation = await canUserUseModel(model, usingBYOK, userId, isGuest);

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

    // Get Runware API key from environment
    const runwareApiKey = process.env.RUNWARE_API_KEY;
    if (!runwareApiKey) {
      console.error('RUNWARE_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Image generation service not configured' },
        { status: 500 }
      );
    }

    // Initialize Runware SDK
    const runware = new Runware({ apiKey: runwareApiKey });

    // Map model names to Runware model IDs
    const modelMapping: Record<string, string> = {
      'FLUX.1 [schnell]': 'runware:100@1',
      'FLUX.1 Dev': 'runware:101@1',
      'Stable Defusion 3': 'runware:5@1',
    };

    const runwareModelId = modelMapping[model];
    if (!runwareModelId) {
      return NextResponse.json(
        { error: 'Invalid image generation model' },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating image with model: ${model} (${runwareModelId})`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`📐 Dimensions: ${width}x${height}`);

    // Generate image using Runware
    const imageResults = await runware.requestImages({
      positivePrompt: prompt,
      model: runwareModelId,
      width: width,
      height: height,
      numberResults: numberResults,
      outputType: 'URL' as const,
      outputFormat: 'PNG' as const,
    });

    console.log(`✅ Image generation completed:`, imageResults);

    // Extract the image URL from the first result
    if (!imageResults || imageResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate image - no results returned' },
        { status: 500 }
      );
    }

    const imageUrl = imageResults[0]?.imageURL;
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image - no URL returned' },
        { status: 500 }
      );
    }

    // Consume credits for non-guest users
    if (!isGuest && userId) {
      try {
        await consumeCredits(userId, model, 'image-generation');
        console.log(`💳 Credits consumed for user ${userId} using model ${model}`);
      } catch (error) {
        console.error('Failed to consume credits:', error);
        // Don't fail the request if credit consumption fails
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      model: model,
      prompt: prompt,
      dimensions: { width, height }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    // Handle specific Runware errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key for image generation service' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
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
