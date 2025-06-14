import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, smoothStream } from 'ai';
import { getModelConfig } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

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

    // Force use of Gemini 2.5 Flash Search model for web search
    const modelConfig = getModelConfig('Gemini 2.5 Flash Search');

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: 'Web search model not available' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get OpenRouter API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create OpenRouter client with web search enabled model
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': 'https://atchat.app',
        'X-Title': 'AVChat - AI Chat Application',
        'User-Agent': 'AVChat/1.0.0'
      }
    });
    const aiModel = openrouter(modelConfig.modelId);



    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        console.log('error', error);
      },
      system: `
      You are AVChat, an ai assistant that can answer questions and help with tasks.
      You have access to real-time web search capabilities through Google Search.
      When answering questions, use the most up-to-date information available from web search.
      Be helpful and provide relevant information with proper citations.
      Be respectful and polite in all interactions.
      Be engaging and maintain a conversational tone.
      Always use LaTeX for mathematical expressions -
      Inline math must be wrapped in single dollar signs: $content$
      Display math must be wrapped in double dollar signs: $$content$$
      Display math should be placed on its own line, with nothing else on that line.
      Do not nest math delimiters or mix styles.
      Examples:
      - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
      - Display:
      $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$

      When you use web search results, make sure to provide the source URLs in your response.
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
