import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits } from '@/lib/tierSystem';

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt, isTitle, messageId, threadId, userApiKey, userId } = body;

  // Check tier validation for title generation (uses Gemini 2.5 Flash)
  const usingBYOK = !!userApiKey;
  const tierValidation = await canUserUseModel('Gemini 2.5 Flash', usingBYOK, userId);

  if (!tierValidation.canUseModel) {
    return NextResponse.json(
      {
        error: tierValidation.message || 'Model access denied',
        code: 'TIER_LIMIT_EXCEEDED'
      },
      { status: 403 }
    );
  }

  // Consume credits for title generation
  const creditsConsumed = await consumeCredits('Gemini 2.5 Flash', usingBYOK, userId);
  if (!creditsConsumed && !usingBYOK) {
    return NextResponse.json(
      {
        error: 'Insufficient credits for title generation',
        code: 'INSUFFICIENT_CREDITS'
      },
      { status: 403 }
    );
  }

  // Use user's API key if provided, otherwise fall back to system key
  const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'OpenRouter API key not configured. Please add your API key in Settings.',
      },
      { status: 500 }
    );
  }

  const openrouter = createOpenRouter({
    apiKey,
    headers: {
      'HTTP-Referer': 'https://atchat.ayush-sharma.in',
      'X-Title': 'AVChat - AI Chat Application',
      'User-Agent': 'AVChat/1.0.0'
    }
  });

  // Validate required fields
  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  if (!messageId || typeof messageId !== 'string') {
    return NextResponse.json(
      { error: 'Message ID is required' },
      { status: 400 }
    );
  }

  if (!threadId || typeof threadId !== 'string') {
    return NextResponse.json(
      { error: 'Thread ID is required' },
      { status: 400 }
    );
  }

  try {
    const { text: title } = await generateText({
      model: openrouter('openai/gpt-4.1-nano'),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - if the user has attached files, consider them in the title (e.g., "Image analysis request", "PDF document review", etc.)
      - you should NOT answer the user's message, you should only generate a summary/title
      - do not use quotes or colons`,
      prompt,
    });

    return NextResponse.json({ title, isTitle, messageId, threadId });
  } catch (error) {
    console.error('Failed to generate title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
