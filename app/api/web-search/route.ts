import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, smoothStream } from 'ai';
import { getModelConfig, AIModel } from '@/lib/models';
import { getConversationStyleConfig, ConversationStyle, DEFAULT_CONVERSATION_STYLE } from '@/lib/conversationStyles';
import { NextRequest, NextResponse } from 'next/server';
import { canUserUseModel, consumeCredits } from '@/lib/tierSystem';
import { tavily } from '@tavily/core';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, conversationStyle, userApiKey, userTavilyApiKey, model, userId, isGuest } = body;

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

    // Use the provided model or default to OpenAI 4.1 Mini
    // Allow any model for web search with Tavily integration
    const selectedModel = model || 'OpenAI 4.1 Mini';
    const modelConfig = getModelConfig(selectedModel);

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: 'Selected model not available' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guest users cannot use web search - block access
    if (isGuest) {
      return new Response(
        JSON.stringify({
          error: 'Web search is not available for guest users. Please sign up to use this feature.',
          code: 'GUEST_WEB_SEARCH_RESTRICTED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user can use this model (tier validation)
    // For web search, consider both OpenRouter BYOK and Tavily BYOK
    const usingBYOK = !!userApiKey;
    const usingTavilyBYOK = !!userTavilyApiKey;

    const tierValidation = await canUserUseModel(selectedModel as AIModel, usingBYOK, userId, isGuest);

    if (!tierValidation.canUseModel) {
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

    // Extract search query from the last user message
    const lastUserMessage = messages.filter((msg: any) => msg.role === 'user').pop();
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found for search' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const searchQuery = lastUserMessage.content;
    console.log(`🔍 Extracted search query from user message: "${searchQuery}"`);
    console.log(`🔍 Last user message:`, lastUserMessage);
    console.log(`🔍 BYOK Status - OpenRouter: ${!!userApiKey}, Tavily: ${!!userTavilyApiKey}`);

    // Use user's Tavily API key if provided, otherwise fall back to system key
    const tavilyApiKey = userTavilyApiKey || process.env.TAVILY_API_KEY;
    const usingUserTavilyKey = !!userTavilyApiKey;

    console.log(`🔍 Tavily API key source: ${usingUserTavilyKey ? 'User BYOK' : 'System'}`);
    console.log(`🔍 User Tavily key provided: ${!!userTavilyApiKey}`);

    if (!tavilyApiKey) {
      return new Response(
        JSON.stringify({
          error: 'Tavily API key not configured. Please add your Tavily API key in Settings → Application or configure TAVILY_API_KEY environment variable.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Perform Tavily search
    let searchResults;
    try {
      const tvly = tavily({ apiKey: tavilyApiKey });
      console.log(`🔍 Performing Tavily search for: "${searchQuery}"`);

      const tavilyResponse = await tvly.search(searchQuery, {
        search_depth: "advanced",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
        include_images: false
      });

      searchResults = tavilyResponse.results || [];
      console.log(`✅ Tavily search completed. Found ${searchResults.length} results`);
    } catch (error) {
      console.error('Tavily search error:', error);
      return new Response(
        JSON.stringify({
          error: 'Web search failed. Please try again later.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Consume credits for the LLM model (not for search)
    // If user has their own Tavily key, they don't consume web search credits
    const creditsConsumed = await consumeCredits(selectedModel as AIModel, usingBYOK, userId, isGuest);
    if (!creditsConsumed && !usingBYOK) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits for web search',
          code: 'INSUFFICIENT_CREDITS'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔍 Web search credits consumed for user ${userId} using model ${selectedModel}`);

    // Use user's API key if provided, otherwise fall back to system key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured. Please add your API key in Settings → Application.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        'HTTP-Referer': 'https://avchat.ayush-sharma.in/',
        'X-Title': 'AVChat - AI Chat Application',
        'User-Agent': 'AVChat/1.0.0'
      }
    });
    const aiModel = openrouter(modelConfig.modelId);

    // Get conversation style configuration
    const styleConfig = getConversationStyleConfig(
      (conversationStyle as ConversationStyle) || DEFAULT_CONVERSATION_STYLE
    );

    // Format search results for the LLM
    const searchContext = searchResults.length > 0 ?
      searchResults.map((result: any, index: number) =>
        `[${index + 1}] ${result.title}\nURL: ${result.url}\nContent: ${result.content}\n`
      ).join('\n') : 'No search results found.';

    // Extract URLs for citation purposes
    const searchUrls = searchResults.map((result: any) => result.url);

    // Log search URLs for debugging
    console.log('🔗 Search URLs to be used for citations:', searchUrls);

    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        console.log('error', error);
      },
      onFinish: (result) => {
        console.log('🔍 Web search response finished. Text length:', result.text.length);
        console.log('🔍 Checking if search URLs marker is present in response...');
        const hasMarker = result.text.includes('<!-- SEARCH_URLS:');
        console.log('🔍 Search URLs marker present:', hasMarker);
        if (hasMarker) {
          const markerMatch = result.text.match(/<!-- SEARCH_URLS: (.*?) -->/);
          if (markerMatch) {
            console.log('🔍 Extracted URLs from marker:', markerMatch[1].split('|'));
          }
        }
      },
      system: `
      ${styleConfig.systemPrompt}

      You are AVChat, an ai assistant that can answer questions and help with tasks.
      You have access to real-time web search capabilities through Tavily Search.

      SEARCH RESULTS FOR QUERY: "${searchQuery}"
      ${searchContext}

      Instructions:
      - Start your response with "🔎 **Searched the web** for relevant information..."
      - Use the search results above to provide accurate, up-to-date information from trusted sources
      - Always cite your sources by including the URLs from the search results as clickable links
      - Provide comprehensive, well-structured answers with proper citations and context
      - Be helpful, accurate, and provide relevant information with detailed explanations
      - Be respectful and polite in all interactions
      - If the search results don't contain relevant information, acknowledge this and suggest alternative approaches
      - When possible, cross-reference multiple sources to provide balanced perspectives
      - Include relevant details, statistics, and examples from the search results
      - IMPORTANT: End your response with this exact marker: "<!-- SEARCH_URLS: ${searchUrls.join('|')} -->"

      Always use LaTeX for mathematical expressions:
      - Inline math must be wrapped in single dollar signs: $content$
      - Display math must be wrapped in double dollar signs: $$content$$
      - Display math should be placed on its own line, with nothing else on that line
      - Do not nest math delimiters or mix styles

      Examples:
      - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
      - Display:
      $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$

      IMPORTANT: When referencing information from the search results, include the source URLs in your response.
      Available source URLs: ${searchUrls.join(', ')}

      CRITICAL: You MUST end your response with exactly this line: "<!-- SEARCH_URLS: ${searchUrls.join('|')} -->"
      This marker is required for proper citation functionality and will be hidden from the user.
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
