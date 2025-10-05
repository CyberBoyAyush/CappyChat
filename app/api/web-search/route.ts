import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream } from "ai";
import { getModelConfig, AIModel } from "@/lib/models";
import {
  getConversationStyleConfig,
  ConversationStyle,
  DEFAULT_CONVERSATION_STYLE,
} from "@/lib/conversationStyles";
import { NextRequest, NextResponse } from "next/server";
import { canUserUseModel, consumeCredits, getUserPreferencesServer } from "@/lib/tierSystem";
import { tavily } from "@tavily/core";
import { devLog, devWarn, devError, prodError } from "@/lib/logger";

export const maxDuration = 60;

// Helper function to generate multi-queries
async function generateMultiQueries(searchQuery: string): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-text-generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: searchQuery,
        isMultiQuery: true,
      }),
    });

    if (!response.ok) {
      devWarn('Failed to generate multi-queries, using single query');
      return [searchQuery];
    }

    const data = await response.json();
    return data.queries || [searchQuery];
  } catch (error) {
    devWarn('Error generating multi-queries:', error);
    return [searchQuery];
  }
}

// Helper function for Parallel AI search
async function searchWithParallelAI(queries: string[]) {
  const parallelsApiKey = process.env.PARALLELS_API_KEY;
  if (!parallelsApiKey) {
    throw new Error('Parallel AI API key not configured');
  }

  // Limit to 5 queries max
  const limitedQueries = queries.slice(0, 5);

  devLog(`🔍 Performing Parallel AI search with ${limitedQueries.length} queries`);

  const response = await fetch('https://api.parallel.ai/v1beta/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': parallelsApiKey,
    },
    body: JSON.stringify({
      objective: limitedQueries[0], // First query is the main objective
      search_queries: limitedQueries,
      processor: 'base',
      max_results: 10,
      max_chars_per_result: 6000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Parallel AI search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

// Helper function for Tavily image search
async function searchImagesWithTavily(query: string, tavilyApiKey: string) {
  try {
    const tvly = tavily({ apiKey: tavilyApiKey });
    const tavilyResponse: any = await tvly.search(query, {
      search_depth: "basic",
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
      include_images: true,
    });

    const rawImages = tavilyResponse?.images || [];
    const imageUrls = (
      Array.from(
        new Set(
          rawImages
            .map((img: any) => (typeof img === "string" ? img : img?.url))
            .filter((u: any) => typeof u === "string" && /^https?:\/\//.test(u))
        )
      ) as string[]
    ).slice(0, 15);

    devLog(`🖼️ Tavily images extracted: ${imageUrls.length}`);
    return imageUrls;
  } catch (error) {
    devWarn('Failed to fetch images from Tavily:', error);
    return [];
  }
}

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
  try {
    const body = await req.json();
    const {
      messages,
      conversationStyle,
      userApiKey,
      userTavilyApiKey,
      model,
      userId,
      isGuest,
    } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
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
    const modelConfig = getModelConfig(selectedModel);

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

    // Perform web search based on user's preference
    let searchResults: any[] = [];
    let imageUrls: string[] = [];
    let searchQueries: string[] = [searchQuery];

    try {
      if (webTool === 'parallels') {
        // Parallel AI search flow
        devLog(`🔍 Using Parallel AI for web search`);

        // Generate multi-queries
        searchQueries = await generateMultiQueries(searchQuery);
        devLog(`🔍 Generated ${searchQueries.length} queries for Parallel AI`);

        // Perform Parallel AI search
        searchResults = await searchWithParallelAI(searchQueries);
        devLog(`✅ Parallel AI search completed. Found ${searchResults.length} results`);

        // Get images from Tavily (Parallel AI doesn't support images)
        if (tavilyApiKey) {
          imageUrls = await searchImagesWithTavily(searchQuery, tavilyApiKey);
        }
      } else {
        // Tavily search flow (existing implementation)
        if (!tavilyApiKey) {
          return new Response(
            JSON.stringify({
              error:
                "Tavily API key not configured. Please add your Tavily API key in Settings → Application or configure TAVILY_API_KEY environment variable.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const tvly = tavily({ apiKey: tavilyApiKey });
        devLog(`🔍 Performing Tavily search for: "${searchQuery}"`);

        // Add timeout wrapper to prevent hanging on Tavily search
        const searchTimeout = new Promise<never>(
          (_, reject) =>
            setTimeout(() => reject(new Error("Tavily search timeout")), 15000) // 15 second timeout
        );

        const searchPromise = tvly.search(searchQuery, {
          search_depth: "basic",
          max_results: 15,
          include_answer: false,
          include_raw_content: false,
          include_images: true,
        });

        const tavilyResponse = await Promise.race([searchPromise, searchTimeout]);

        // Extract image URLs from Tavily response (top-level images array)
        try {
          const rawImages = (tavilyResponse as any)?.images || [];
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
          devLog(`🖼️ Tavily images extracted: ${imageUrls.length}`);
        } catch (e) {
          devWarn("Failed to parse Tavily images array", e);
          imageUrls = [];
        }

        searchResults = tavilyResponse.results || [];
        devLog(
          `✅ Tavily search completed. Found ${searchResults.length} results`
        );
      }
    } catch (error) {
      prodError("Web search error", error, "WebSearchAPI");

      // Provide more specific error messages
      let errorMessage = "Web search failed. Please try again later.";
      if (error instanceof Error && error.message.includes("timeout")) {
        errorMessage =
          "Web search timed out. Please try again with a more specific query.";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
    } catch (error) {
      devError("Failed to consume credits:", error);

      // If it's a timeout error, continue with the search but log the issue
      if (error instanceof Error && error.message.includes("timeout")) {
        devWarn("Credit consumption timed out, continuing with search...");
        // Continue execution - don't block the search for credit consumption issues
      } else {
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

    // Format search results for the LLM
    // Handle both Parallel AI (excerpts array) and Tavily (content field) formats
    const searchContext =
      searchResults.length > 0
        ? searchResults
            .map((result: any, index: number) => {
              // Parallel AI returns excerpts array, Tavily returns content string
              const content = result.excerpts
                ? result.excerpts.join(' ')
                : result.content || '';

              return `[${index + 1}] ${result.title}\nURL: ${result.url}\nContent: ${content}\n`;
            })
            .join("\n")
        : "No search results found.";

    // Extract URLs for citation purposes
    const searchUrls = searchResults.map((result: any) => result.url);

    // Log search URLs for debugging
    devLog("🔗 Search URLs to be used for citations:", searchUrls);

    // Process messages - web search does not support file attachments
    const processedMessages = messages as Parameters<typeof streamText>[0]["messages"];

    // Build system prompt with improved Scira AI-inspired instructions
    const systemPrompt = `
      ${styleConfig.systemPrompt}

      You are CappyChat, an AI assistant with real-time web search capabilities.
      You have access to current information from the web through ${webTool === 'parallels' ? 'Parallel AI' : 'Tavily'} search.

      SEARCH RESULTS FOR QUERY: "${searchQuery}"
      ${searchContext}

      ### 🚨 CRITICAL CITATION RULES - MUST FOLLOW EXACTLY 🚨

      ⚠️ EVERY CITATION MUST BE A CLICKABLE NUMBERED LINK ⚠️

      📌 MANDATORY FORMAT: [1](Full URL), [2](Full URL), [3](Full URL)

      ✅ USE NUMBERS AS LINK TEXT - THIS IS THE ONLY ALLOWED FORMAT!

      RULES:
      1. Use sequential numbers [1], [2], [3], etc. as the link text
      2. Put the full URL in parentheses () immediately after the number
      3. Place citations immediately after the fact they support
      4. Use actual URLs from search results above
      5. Start numbering from [1] for each response
      6. Each citation must be clickable: [Number](URL)

      ✅ CORRECT FORMAT - COPY THIS PATTERN:

      Example 1:
      "The ICICI Coral Card offers 25% off on movie tickets [1](https://www.icicibank.com/coral-card)."

      Example 2:
      "The card has a joining fee of INR 500 + GST [2](https://www.paisabazaar.com/credit-card/icici)."

      Example 3 (multiple sources):
      "The card provides travel insurance [3](https://www.icicibank.com/travel) and lounge access [4](https://www.paisabazaar.com/perks)."

      ❌ WRONG FORMAT - NEVER DO THIS:

      ✗ "The card offers 5% cashback [1]."  ← MISSING (URL)!
      ✗ "The card offers 5% cashback [Amazon Pay ICICI Card Benefits]."  ← DON'T USE TITLES, USE NUMBERS!
      ✗ "The card offers 5% cashback (https://www.icicibank.com)."  ← MISSING [Number]!
      ✗ "The card offers 5% cashback https://www.icicibank.com"  ← NO MARKDOWN!

      ✗ NEVER create a references section like this:
      References:
      [1] https://example.com
      [2] https://example2.com
      ← THIS IS COMPLETELY FORBIDDEN!

      ⚠️ ABSOLUTELY FORBIDDEN:
      - Writing [Number] without (URL) immediately after
      - Using descriptive titles instead of numbers
      - Grouping citations at the end of response
      - Creating "References" or "Sources" sections
      - Using plain URLs without markdown format

      💡 REMEMBER: The format is ALWAYS [Number](Full URL) - both parts together!
      💡 Use sequential numbers [1], [2], [3], etc. as the clickable link text!

      ⚠️ MANDATORY: Use '$' for ALL inline equations without exception
      ⚠️ MANDATORY: Use '$$' for ALL block equations without exception
      ⚠️ NEVER use '$' symbol for currency - Always use "USD", "EUR", etc.
      - Tables must use plain text without any formatting
      - Mathematical expressions must always be properly delimited

      ⚠️ ABSOLUTELY FORBIDDEN section names:
      - "Additional Resources"
      - "Further Reading"
      - "Useful Links"
      - "External Links"
      - "References"
      - "Citations"
      - "Sources"
      - "Bibliography"
      - "Works Cited"

      ### RESPONSE GUIDELINES:
      - Always respond with markdown format
      - Use the search results to provide accurate, up-to-date information
      - 🚨 CRITICAL: Cite sources inline using [Title](URL) format - BOTH parts required!
      - Use the actual URLs from the list below
      - Provide comprehensive, well-structured answers
      - If search results don't contain relevant information, acknowledge this
      - Cross-reference multiple sources for balanced perspectives
      - Include relevant details, statistics, and examples

      ### 📋 AVAILABLE SOURCE URLS (USE THESE IN YOUR CITATIONS):
      ${searchUrls.map((url, i) => `${i + 1}. ${url}`).join('\n      ')}

      🔴 FINAL REMINDER: Every citation MUST be [Title](URL) format with BOTH parts!
      Example: "The card offers benefits [ICICI Card Guide](${searchUrls[0] || 'https://example.com'})."
      NOT: "The card offers benefits [ICICI Card Guide]." ← This is WRONG!

      CRITICAL: You MUST end your response with exactly these two lines:
      "<!-- SEARCH_URLS: ${searchUrls.join("|")} -->"
      "<!-- SEARCH_IMAGES: ${imageUrls.join("|")} -->"
      These markers are required for proper citation and image preview functionality and will be hidden from the user.
      `;

    const result = streamText({
      model: aiModel,
      messages: processedMessages,
      onError: (error) => {
        devLog("error", error);
      },
      onFinish: (result) => {
        devLog(
          "🔍 Web search response finished. Text length:",
          result.text.length
        );

        // Check for broken citations
        const brokenCitationRegex = /\[([^\]]+)\](?!\()/g;
        const brokenMatches = [...result.text.matchAll(brokenCitationRegex)];
        if (brokenMatches.length > 0) {
          devWarn(`⚠️ Found ${brokenMatches.length} broken citations (missing URLs):`,
            brokenMatches.map(m => m[0]));
        }

        devLog("🔍 Checking if search URLs marker is present in response...");
        const hasMarker = result.text.includes("<!-- SEARCH_URLS:");
        devLog("🔍 Search URLs marker present:", hasMarker);
        if (hasMarker) {
          const markerMatch = result.text.match(/<!-- SEARCH_URLS: (.*?) -->/);
          if (markerMatch) {
            devLog("🔍 Extracted URLs from marker:", markerMatch[1].split("|"));
          }
        }
      },
      system: systemPrompt,
      experimental_transform: [smoothStream({ chunking: "word" })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    devLog("error", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
