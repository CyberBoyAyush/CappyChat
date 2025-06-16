import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, smoothStream } from 'ai';
import { getModelConfig, AIModel } from '@/lib/models';
import { getConversationStyleConfig, ConversationStyle, DEFAULT_CONVERSATION_STYLE } from '@/lib/conversationStyles';
import { NextRequest, NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits } from '@/lib/tierSystem';

export const maxDuration = 60;



export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, conversationStyle, userApiKey, experimental_attachments, userId } = body;

    console.log('=== CHAT MESSAGING API DEBUG ===');
    console.log('Number of messages received:', messages?.length);
    console.log('Experimental attachments:', experimental_attachments);
    console.log('Messages structure:', JSON.stringify(messages, null, 2));

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!model || typeof model !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Model is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const modelConfig = getModelConfig(model as AIModel);

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid model specified' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user can use this model (tier validation)
    const usingBYOK = !!userApiKey;
    console.log(`[ChatAPI] Model: ${model}, BYOK: ${usingBYOK}, UserApiKey: ${userApiKey ? 'present' : 'not present'}`);

    const tierValidation = await canUserUseModel(model as AIModel, usingBYOK, userId);
    console.log('[ChatAPI] Tier validation result:', tierValidation);

    if (!tierValidation.canUseModel) {
      console.log('[ChatAPI] Model access denied, returning 403');
      return new Response(
        JSON.stringify({
          error: tierValidation.message || 'Model access denied',
          code: 'TIER_LIMIT_EXCEEDED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Consume credits before making the API call
    const creditsConsumed = await consumeCredits(model as AIModel, usingBYOK, userId);
    if (!creditsConsumed && !usingBYOK) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits for this model',
          code: 'INSUFFICIENT_CREDITS'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use user's API key if provided, otherwise fall back to system key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured. Please add your API key in Settings.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // All models now use OpenRouter with app identification headers
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': 'https://atchat.app',
        'X-Title': 'AVChat - AI Chat Application',
        'User-Agent': 'AVChat/1.0.0'
      }
    });
    const aiModel = openrouter(modelConfig.modelId);

    // Get conversation style configuration
    const styleConfig = getConversationStyleConfig(
      (conversationStyle as ConversationStyle) || DEFAULT_CONVERSATION_STYLE
    );

    // Process messages to handle experimental_attachments
    const processedMessages = messages.map((message: Record<string, unknown>) => {
      if (message.experimental_attachments && Array.isArray(message.experimental_attachments) && message.experimental_attachments.length > 0) {
        console.log('Processing message with experimental_attachments:', message.experimental_attachments.length);

        // Convert our attachment format to AI SDK format
        const aiSdkAttachments = message.experimental_attachments.map((attachment: Record<string, unknown>) => ({
          name: (attachment.originalName || attachment.filename) as string,
          contentType: (attachment.mimeType || attachment.contentType) as string,
          url: attachment.url as string,
        }));

        console.log('AI SDK attachments:', JSON.stringify(aiSdkAttachments, null, 2));

        return {
          ...message,
          experimental_attachments: aiSdkAttachments,
        };
      }
      return message;
    }) as Parameters<typeof streamText>[0]['messages'];

    console.log('Final processed messages:', processedMessages?.length);

    console.log('Sending request to AI SDK with model:', modelConfig.modelId);
    console.log('Number of processed messages:', processedMessages?.length);

    const result = streamText({
      model: aiModel,
      messages: processedMessages,
      onError: (error) => {
        console.error('OpenRouter API error:', error);
      },
      system: `
      ${styleConfig.systemPrompt}

      You are AVChat, an ai assistant that can answer questions and help with tasks.
      Be helpful and provide relevant information about any documents, images, or files that are shared with you.
      Be respectful and polite in all interactions.
      Always use LaTeX for mathematical expressions -
      Inline math must be wrapped in single dollar signs: $content$
      Display math must be wrapped in double dollar signs: $$content$$
      Display math should be placed on its own line, with nothing else on that line.
      Do not nest math delimiters or mix styles.
      Examples:
      - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
      - Display:
      $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$

      When analyzing documents or files, provide detailed and helpful information about their contents.
      `,
      experimental_transform: [smoothStream({ chunking: 'word' })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    console.log('error', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
