import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream } from "ai";
import { getModelConfig, AIModel } from "@/lib/models";
import {
  getConversationStyleConfig,
  ConversationStyle,
  DEFAULT_CONVERSATION_STYLE,
} from "@/lib/conversationStyles";
import { NextRequest, NextResponse } from "next/server";
import { canUserUseModel, consumeCredits } from "@/lib/tierSystem";
import { tavily } from "@tavily/core";
import { devLog, devWarn, devError, prodError } from "@/lib/logger";

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

    // Use user's Tavily API key if provided, otherwise fall back to system key
    const tavilyApiKey = userTavilyApiKey || process.env.TAVILY_API_KEY;
    const usingUserTavilyKey = !!userTavilyApiKey;

    devLog(
      `🔍 Tavily API key source: ${usingUserTavilyKey ? "User BYOK" : "System"}`
    );
    devLog(`🔍 User Tavily key provided: ${!!userTavilyApiKey}`);

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

    // Perform Tavily search with timeout protection
    let searchResults;
    let imageUrls: string[] = [];

    try {
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
    } catch (error) {
      prodError("Tavily search error", error, "WebSearchAPI");

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
    const searchContext =
      searchResults.length > 0
        ? searchResults
            .map(
              (result: any, index: number) =>
                `[${index + 1}] ${result.title}\nURL: ${result.url}\nContent: ${
                  result.content
                }\n`
            )
            .join("\n")
        : "No search results found.";

    // Extract URLs for citation purposes
    const searchUrls = searchResults.map((result: any) => result.url);

    // Log search URLs for debugging
    devLog("🔗 Search URLs to be used for citations:", searchUrls);

    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        devLog("error", error);
      },
      onFinish: (result) => {
        devLog(
          "🔍 Web search response finished. Text length:",
          result.text.length
        );
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
      system: `
      ${styleConfig.systemPrompt}

      You are CappyChat, an ai assistant that can answer questions and help with tasks.
      You have access to real-time web search capabilities through Tavily Search.

      SEARCH RESULTS FOR QUERY: "${searchQuery}"
      ${searchContext}

      Instructions:
      - Use the search results above to provide accurate, up-to-date information from trusted sources
      - Always cite your sources by including the URLs from the search results as clickable links
      - Provide comprehensive, well-structured answers with proper citations and context
      - Be helpful, accurate, and provide relevant information with detailed explanations
      - Be respectful and polite in all interactions
      - If the search results don't contain relevant information, acknowledge this and suggest alternative approaches
      - When possible, cross-reference multiple sources to provide balanced perspectives
      - Include relevant details, statistics, and examples from the search results
      - IMPORTANT: End your response with these exact markers on separate lines:
        "<!-- SEARCH_URLS: ${searchUrls.join("|")} -->"
        "<!-- SEARCH_IMAGES: ${imageUrls.join("|")} -->"

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
      Available source URLs: ${searchUrls.join(", ")}

      CRITICAL: You MUST end your response with exactly these two lines:
      "<!-- SEARCH_URLS: ${searchUrls.join("|")} -->"
      "<!-- SEARCH_IMAGES: ${imageUrls.join("|")} -->"
      These markers are required for proper citation and image preview functionality and will be hidden from the user.
      `,
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
