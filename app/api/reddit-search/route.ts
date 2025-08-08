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
    const {
      messages,
      model,
      conversationStyle,
      userId,
      userApiKey,
      userTavilyApiKey,
      isGuest,
    } = await req.json();

    // Use the provided model or default to OpenAI 4.1 Mini
    const selectedModel = model || 'OpenAI 4.1 Mini';

    console.log(`🔍 Reddit search request received for user ${userId} using model ${selectedModel}`);

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the last user message as the search query
    const lastUserMessage = messages.filter((msg: any) => msg.role === 'user').pop();
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Guest users cannot use Reddit search - block access
    if (isGuest) {
      return new Response(
        JSON.stringify({
          error: 'Reddit search is not available for guest users. Please sign up to use this feature.',
          code: 'GUEST_REDDIT_SEARCH_RESTRICTED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate model access and consume credits
    const modelConfig = getModelConfig(selectedModel as AIModel);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid model selected' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user can use the selected model
    const usingBYOK = !!userApiKey;
    const tierValidation = await canUserUseModel(selectedModel as AIModel, usingBYOK, userId, false);

    if (!tierValidation.canUseModel) {
      return new Response(
        JSON.stringify({
          error: tierValidation.message || 'You do not have access to this model',
          code: 'TIER_LIMIT_EXCEEDED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const searchQuery = lastUserMessage.content;
    console.log(`🔍 Extracted Reddit search query from user message: "${searchQuery}"`);
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
          error: 'Tavily API key not configured. Please add your Tavily API key in Settings → Application.' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Perform Tavily search with Reddit domain filtering and timeout protection
    let searchResults;
    try {
      const tvly = tavily({ apiKey: tavilyApiKey });
      console.log(`🔍 Performing Tavily Reddit search for: "${searchQuery}"`);

      // Add timeout wrapper to prevent hanging on Tavily search
      const searchTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tavily search timeout')), 15000) // 15 second timeout
      );

      const searchPromise = tvly.search(searchQuery, {
        search_depth: "basic",
        max_results: 15,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        include_domains: ["reddit.com"] // Filter to Reddit only
      });

      const tavilyResponse = await Promise.race([searchPromise, searchTimeout]);
      searchResults = tavilyResponse.results || [];
      console.log(`✅ Tavily Reddit search completed. Found ${searchResults.length} results`);
    } catch (error) {
      console.error('Tavily Reddit search error:', error);

      // Provide more specific error messages
      let errorMessage = 'Reddit search failed. Please try again later.';
      if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage = 'Reddit search timed out. Please try again with a more specific query.';
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Consume credits for the search with timeout protection
    try {
      // Add timeout wrapper to prevent hanging on credit consumption
      const creditTimeout = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Credit consumption timeout')), 10000) // 10 second timeout
      );

      const creditConsumption = consumeCredits(selectedModel as AIModel, usingBYOK, userId, false);

      const creditsConsumed = await Promise.race([creditConsumption, creditTimeout]);

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
    } catch (error) {
      console.error('Failed to consume credits:', error);

      // If it's a timeout error, continue with the search but log the issue
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn('Credit consumption timed out, continuing with search...');
        // Continue execution - don't block the search for credit consumption issues
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to process request. Please try again.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log(`🔍 Reddit search credits consumed for user ${userId} using model ${selectedModel}`);

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
        'HTTP-Referer': 'https://avchat.xyz/',
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
      ).join('\n') : 'No Reddit search results found.';

    // Extract URLs for citation purposes
    const searchUrls = searchResults.map((result: any) => result.url);

    // Log search URLs for debugging
    console.log('🔗 Reddit search URLs to be used for citations:', searchUrls);

    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        console.log('error', error);
      },
      onFinish: (result) => {
        console.log('🔍 Reddit search response finished. Text length:', result.text.length);
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
      You have access to real-time Reddit search capabilities through Tavily Search.

      REDDIT SEARCH RESULTS FOR QUERY: "${searchQuery}"
      ${searchContext}

      Instructions for using Reddit search results:
      1. Analyze the Reddit posts, comments, and discussions provided
      2. Look for community insights, user experiences, and popular opinions
      3. Identify different subreddits and their perspectives on the topic
      4. Summarize key points from Reddit discussions
      5. Mention specific subreddits when relevant (e.g., r/technology, r/AskReddit)
      6. Include upvote counts or engagement metrics if mentioned in the content
      7. Distinguish between different types of Reddit content (posts, comments, AMAs, etc.)
      8. Be aware that Reddit content represents user opinions and experiences, not necessarily facts
      9. If the search results are limited or not relevant, acknowledge this limitation

      Important guidelines:
      - Always cite your sources using the provided Reddit URLs
      - Be transparent about the source being Reddit discussions
      - Present multiple viewpoints when they exist in the results
      - Acknowledge when information comes from user experiences vs. verified sources
      - If no relevant Reddit results were found, clearly state this

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
