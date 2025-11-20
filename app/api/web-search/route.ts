import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream, tool } from "ai";
import { getModelConfig, AIModel } from "@/lib/models";
import {
  getConversationStyleConfig,
  ConversationStyle,
  DEFAULT_CONVERSATION_STYLE,
} from "@/lib/conversationStyles";
import { NextRequest, NextResponse } from "next/server";
import { canUserUseModel, consumeCredits, getUserPreferencesServer } from "@/lib/tierSystem";
import { devLog, devWarn, devError } from "@/lib/logger";
import { z } from "zod";
import { tavily } from "@tavily/core";
import {
  executeWebsearch,
  executeRetrieval,
  executeWeather,
  executeGreeting
} from "@/lib/tools/actions";
import { checkGuestRateLimit } from "@/lib/guestRateLimit";
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  logRateLimit,
  logCreditConsumption,
  flushLogs,
} from "@/lib/betterstack-logger";

/**
 * Create user-specific tools with preferences baked in
 * This allows the model to call tools without needing to know user preferences
 */
const createUserTools = (webTool: 'parallels' | 'tavily', tavilyApiKey?: string) => ({
  websearch: tool({
    description: 'Search the web for current information, news, articles, and general queries. Use this for broad web searches when the user asks about current events, news, or general information.',
    parameters: z.object({
      query: z.string().describe('The search query to look up on the web'),
    }),
    execute: async (params: { query: string }) => {
      return executeWebsearch({ query: params.query, webTool, tavilyApiKey });
    },
  }),
  retrieval: tool({
    description: 'Retrieve full content from a URL. Returns text, title, summary, and images. Use this when the user asks "what is [domain]", "tell me about [website]", or wants detailed information about a specific URL.',
    parameters: z.object({
      url: z.string().describe('The URL to retrieve content from (e.g., "https://github.com", "openai.com")'),
      include_summary: z.boolean().optional().describe('Include AI-generated summary (default: true)'),
      live_crawl: z.enum(['never', 'auto', 'preferred']).optional().describe('Crawl mode (default: preferred)'),
    }),
    execute: async (params: { url: string; include_summary?: boolean; live_crawl?: 'never' | 'auto' | 'preferred' }) => {
      return executeRetrieval({ url: params.url, include_summary: params.include_summary, live_crawl: params.live_crawl });
    },
  }),
  weather: tool({
    description: 'Get current weather information for a specific location. Use this when the user asks about weather conditions, temperature, forecast, or climate in a specific place.',
    parameters: z.object({
      location: z.string().describe('The city name or location to get weather for (e.g., "New York", "London, UK", "Tokyo")'),
    }),
    execute: async (params: { location: string }) => {
      return executeWeather({ location: params.location });
    },
  }),
  greeting: tool({
    description: 'Respond to simple greetings like "hello", "hi", "hey", "good morning", etc. Use this ONLY for casual greetings that don\'t require web search or other tools.',
    parameters: z.object({
      greeting: z.string().describe('The greeting message from the user'),
    }),
    execute: async (params: { greeting: string }) => {
      return executeGreeting({ greeting: params.greeting });
    },
  }),
});

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const userTavilyApiKey = searchParams.get("userTavilyApiKey") || undefined;

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const tavilyApiKey = userTavilyApiKey || process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const tvly = tavily({ apiKey: tavilyApiKey });

    // 12 images max, fast/basic search
    const tavilyResponse: any = await tvly.search(q, {
      search_depth: "basic",
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
      include_images: true,
    });

    let imageUrls: string[] = [];
    try {
      const rawImages = tavilyResponse?.images || [];
      imageUrls = (
        Array.from(
          new Set(
            rawImages
              .map((img: any) => (typeof img === "string" ? img : img?.url))
              .filter(
                (u: any) => typeof u === "string" && /^https?:\/\//.test(u)
              )
          )
        ) as string[]
      ).slice(0, 15);
    } catch {
      imageUrls = [];
    }

    return NextResponse.json({ images: imageUrls }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const logger = createBetterStackLogger('web-search');
  let userId: string | undefined;
  let model: string | undefined;

  try {
    const body = await req.json();
    const {
      messages,
      conversationStyle,
      userApiKey,
      userTavilyApiKey,
      model: requestModel,
      userId: requestUserId,
      isGuest,
    } = body;

    userId = requestUserId;
    model = requestModel;

    await logApiRequestStart(logger, '/api/web-search', {
      userId: userId || 'guest',
      model: model || 'Gemini 2.5 Flash Lite',
      isGuest: !!isGuest,
      messageCount: messages?.length || 0,
    });

    // Guest rate limiting
    if (isGuest) {
      const rateLimitResponse = await checkGuestRateLimit(req);
      if (rateLimitResponse) {
        await logRateLimit(logger, '/api/web-search', {
          userId: 'guest',
          reason: 'guest_rate_limit',
        });
        await flushLogs(logger);
        return rateLimitResponse;
      }
    }

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      await logValidationError(logger, '/api/web-search', 'messages', 'Messages array is required');
      await flushLogs(logger);
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use the provided model or default to Gemini 2.5 Flash Lite
    // Allow any model for web search with Tavily integration
    const selectedModel = model || "Gemini 2.5 Flash Lite";
    const modelConfig = getModelConfig(selectedModel as any);

    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: "Selected model not available" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Guest users cannot use web search - block access
    if (isGuest) {
      return new Response(
        JSON.stringify({
          error:
            "Web search is not available for guest users. Please sign up to use this feature.",
          code: "GUEST_WEB_SEARCH_RESTRICTED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user can use this model (tier validation)
    // For web search, consider both OpenRouter BYOK and Tavily BYOK
    const usingBYOK = !!userApiKey;

    const tierValidation = await canUserUseModel(
      selectedModel as AIModel,
      usingBYOK,
      userId,
      isGuest
    );

    if (!tierValidation.canUseModel) {
      return new Response(
        JSON.stringify({
          error: tierValidation.message || "Model access denied",
          code: "TIER_LIMIT_EXCEEDED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract search query from the last user message
    const lastUserMessage = messages
      .filter((msg: any) => msg.role === "user")
      .pop();
    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found for search" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const searchQuery = lastUserMessage.content;
    devLog(`🔍 Extracted search query from user message: "${searchQuery}"`);
    devLog(`🔍 Last user message:`, lastUserMessage);
    devLog(
      `🔍 BYOK Status - OpenRouter: ${!!userApiKey}, Tavily: ${!!userTavilyApiKey}`
    );

    // Get user's web tool preference (parallels or tavily)
    let webTool: 'parallels' | 'tavily' = 'parallels'; // Default to parallels
    if (userId && !isGuest) {
      try {
        const userPrefs = await getUserPreferencesServer(userId);
        webTool = userPrefs?.webTool || 'parallels';
        devLog(`🔍 User's web tool preference: ${webTool}`);
      } catch (error) {
        devWarn('Failed to get user preferences, using default (parallels):', error);
      }
    }

    // Use user's Tavily API key if provided, otherwise fall back to system key
    const tavilyApiKey = userTavilyApiKey || process.env.TAVILY_API_KEY;
    const usingUserTavilyKey = !!userTavilyApiKey;

    devLog(
      `🔍 Tavily API key source: ${usingUserTavilyKey ? "User BYOK" : "System"}`
    );
    devLog(`🔍 User Tavily key provided: ${!!userTavilyApiKey}`);

    // Use user's API key if provided, otherwise fall back to system key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "OpenRouter API key not configured. Please add your API key in Settings → Application.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        "HTTP-Referer": "https://cappychat.com/",
        "X-Title": "CappyChat - AI Chat Application",
        "User-Agent": "CappyChat/1.0.0",
      },
    });
    const aiModel = openrouter(modelConfig.modelId);

    // Get conversation style configuration
    const styleConfig = getConversationStyleConfig(
      (conversationStyle as ConversationStyle) || DEFAULT_CONVERSATION_STYLE
    );

    // Process messages - web search does not support file attachments
    const processedMessages = messages as Parameters<typeof streamText>[0]["messages"];

    // Create user-specific tools with preferences
    const userTools = createUserTools(webTool as 'parallels' | 'tavily', tavilyApiKey);

    devLog(`🤖 [tool-calling] Initiating AI-driven tool selection for query: "${searchQuery}"`);

    // Consume credits for the LLM model (not for search) with timeout protection
    // If user has their own Tavily key, they don't consume web search credits
    try {
      // Add timeout wrapper to prevent hanging on credit consumption
      const creditTimeout = new Promise<boolean>(
        (_, reject) =>
          setTimeout(
            () => reject(new Error("Credit consumption timeout")),
            10000
          ) // 10 second timeout
      );

      const creditConsumption = consumeCredits(
        selectedModel as AIModel,
        usingBYOK,
        userId,
        isGuest
      );

      const creditsConsumed = await Promise.race([
        creditConsumption,
        creditTimeout,
      ]);

      if (!creditsConsumed && !usingBYOK) {
        await logValidationError(logger, '/api/web-search', 'credits', 'Insufficient credits for web search');
        await flushLogs(logger);
        return new Response(
          JSON.stringify({
            error: "Insufficient credits for web search",
            code: "INSUFFICIENT_CREDITS",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Log credit consumption
      await logCreditConsumption(logger, {
        userId: userId || 'unknown',
        model: selectedModel,
        usingBYOK,
      });
    } catch (error) {
      devError("Failed to consume credits:", error);

      // If it's a timeout error, continue with the search but log the issue
      if (error instanceof Error && error.message.includes("timeout")) {
        devWarn("Credit consumption timed out, continuing with search...");
        // Continue execution - don't block the search for credit consumption issues
      } else {
        await logApiRequestError(logger, '/api/web-search', error, {
          userId: userId || 'unknown',
          model: selectedModel,
        });
        await flushLogs(logger);
        return new Response(
          JSON.stringify({
            error: "Failed to process request. Please try again.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    devLog(
      `🔍 Web search credits consumed for user ${userId} using model ${selectedModel}`
    );

    // Build system prompt for model-driven tool calling
    const systemPrompt = `
      ${styleConfig.systemPrompt}

      You are CappyChat, an AI assistant with access to multiple specialized tools for web search, weather information, website content retrieval, and greetings.

      **Available Tools:**
      - websearch: Search the web for current information, news, articles. Returns search results with URLs and image URLs.
      - weather: Get current weather information for a location. Returns temperature, conditions, etc.
      - retrieval: Retrieve full content from a specific URL/website using Exa crawl. Returns full text, summary, and metadata.
      - greeting: Respond to simple greetings without external API calls.

      **Instructions:**
      1. Analyze the user's query and intelligently select the appropriate tool(s) to use
      2. Call the tool(s) to gather information
      3. Use the tool results to provide a comprehensive, well-structured answer
      4. For websearch and retrieval results: ALWAYS cite sources inline using [Number](URL) format
      5. For weather queries: Present information clearly with temperature, conditions, humidity, etc.
      6. For greetings: Respond warmly and naturally
      7. **CRITICAL**: If the websearch tool returns image URLs, you MUST include them at the end of your response in this exact format:
         <!-- SEARCH_IMAGES: url1|url2|url3 -->
         (Replace url1, url2, url3 with the actual image URLs from the tool results, separated by | pipes)
      8. **CRITICAL**: If the retrieval tool returns data, you MUST include this metadata at the START of your response:
         <!-- RETRIEVAL_CARD: {"url":"https://example.com","title":"Site Title","favicon":"https://example.com/favicon.ico","image":"https://example.com/og-image.jpg","summary":"Brief summary"} -->
         (Use actual data from the retrieval tool results)

      ### 🚨 CRITICAL CITATION RULES (for websearch and retrieval results) 🚨

      ⚠️ EVERY CITATION MUST BE A CLICKABLE NUMBERED LINK ⚠️

      📌 MANDATORY FORMAT: [1](Full URL), [2](Full URL), [3](Full URL)

      ✅ USE NUMBERS AS LINK TEXT - THIS IS THE ONLY ALLOWED FORMAT!

      RULES:
      1. Use sequential numbers [1], [2], [3], etc. as the link text
      2. Put the full URL in parentheses () immediately after the number
      3. Place citations immediately after the fact they support
      4. Use actual URLs from tool results
      5. Start numbering from [1] for each response
      6. Each citation must be clickable: [Number](URL)

      ✅ CORRECT FORMAT:
      "GitHub is a platform for version control [1](https://github.com)."

      ❌ WRONG FORMAT:
      ✗ "GitHub is a platform [1]."  ← MISSING (URL)!
      ✗ "GitHub is a platform [GitHub]."  ← DON'T USE TITLES, USE NUMBERS!

      ⚠️ ABSOLUTELY FORBIDDEN:
      - Writing [Number] without (URL) immediately after
      - Using descriptive titles instead of numbers
      - Creating "References" or "Sources" sections at the end
      - Using plain URLs without markdown format

      💡 REMEMBER: The format is ALWAYS [Number](Full URL) - both parts together!

      ⚠️ MANDATORY: Use '$' for ALL inline equations without exception
      ⚠️ MANDATORY: Use '$$' for ALL block equations without exception
      ⚠️ NEVER use '$' symbol for currency - Always use "USD", "EUR", etc.

      ### RESPONSE GUIDELINES:
      - Always respond with markdown format
      - Use tool results to provide accurate, up-to-date information
      - Cite sources inline using [Number](URL) format
      - Provide comprehensive, well-structured answers
      - If tool results don't contain relevant information, acknowledge this
      - Include relevant details, statistics, and examples
      `;

    const result = streamText({
      model: aiModel,
      messages: processedMessages,
      tools: userTools, // Add tools for model-driven tool calling
      // maxToolRoundtrips: 5, // Removed in AI SDK 5 - model handles tool calls automatically
      onError: (error) => {
        devLog("error", error);
      },
      onFinish: async (result) => {
        devLog(
          "🔍 Web search response finished. Text length:",
          result.text.length
        );

        // Log tool usage
        let toolsUsed: string[] = [];
        if (result.steps && result.steps.length > 0) {
          toolsUsed = result.steps
            .flatMap(step => step.toolCalls?.map(tc => tc.toolName) || [])
            .filter((v, i, a) => a.indexOf(v) === i); // unique
          devLog(`🔧 Tools used: ${toolsUsed.join(', ')}`);
        }

        // Check for broken citations
        const brokenCitationRegex = /\[([^\]]+)\](?!\()/g;
        const brokenMatches = [...result.text.matchAll(brokenCitationRegex)];
        if (brokenMatches.length > 0) {
          devWarn(`⚠️ Found ${brokenMatches.length} broken citations (missing URLs):`,
            brokenMatches.map(m => m[0]));
        }

        // Log success
        await logApiRequestSuccess(logger, '/api/web-search', {
          userId: userId || 'unknown',
          model: selectedModel,
          textLength: result.text.length,
          toolsUsed: toolsUsed.join(', '),
          toolCallCount: result.steps?.length || 0,
        });
        await flushLogs(logger);
      },
      system: systemPrompt,
      experimental_transform: [smoothStream({ chunking: "word" })],
      abortSignal: req.signal,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    devLog("error", error);
    await logApiRequestError(logger, '/api/web-search', error, {
      userId: userId || 'unknown',
      model: model || 'unknown',
    });
    await flushLogs(logger);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
