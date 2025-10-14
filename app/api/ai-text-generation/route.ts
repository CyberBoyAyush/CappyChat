import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logValidationError,
  flushLogs,
} from "@/lib/betterstack-logger";

export async function POST(req: Request) {
  // Create Better Stack logger for this request
  const logger = createBetterStackLogger("ai-text-generation");

  try {
    const body = await req.json();
    const {
      prompt,
      isTitle,
      isEnhancement,
      context,
      messageId,
      threadId,
      userApiKey,
      isSuggestions,
      userQuestion,
      aiAnswer,
      suggestionCount,
      isQueryOptimization,
      isMultiQuery, // For generating multiple search queries
    } = body;

    // Determine request type for logging
    const requestType = isTitle
      ? "title"
      : isEnhancement
      ? "enhancement"
      : isSuggestions
      ? "suggestions"
      : isQueryOptimization
      ? "query-optimization"
      : isMultiQuery
      ? "multi-query"
      : "unknown";

    // Log request start
    await logApiRequestStart(logger, "/api/ai-text-generation", {
      requestType,
      hasPrompt: !!prompt,
      hasContext: !!context,
      hasSuggestions: !!isSuggestions,
    });

    // AI text generation is completely free - no tier validation or credit consumption
    console.log(
      "📝 AI text generation - completely free service (no credits consumed)"
    );

    // Use user's API key if provided, otherwise fall back to system key
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      await logValidationError(logger, "/api/ai-text-generation", "apiKey", "API key not configured");
      await flushLogs(logger);
      return NextResponse.json(
        {
          error:
            "OpenRouter API key not configured. Please add your API key in Settings → Application.",
        },
        { status: 500 }
      );
    }

    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        "HTTP-Referer": "https://cappychat.com",
        "X-Title": "CappyChat - AI Chat Application",
        "User-Agent": "CappyChat/1.0.0",
      },
    });

    // Validate required fields (skip for suggestions, query optimization, and multi-query)
    if (!isEnhancement && !isSuggestions && !isQueryOptimization && !isMultiQuery) {
      if (!prompt || typeof prompt !== "string") {
        await logValidationError(logger, "/api/ai-text-generation", "prompt", "Prompt is required");
        await flushLogs(logger);
        return NextResponse.json(
          { error: "Prompt is required" },
          { status: 400 }
        );
      }
    }

    // For enhancement, suggestions, query optimization, or multi-query, we don't need messageId and threadId
    if (!isEnhancement && !isSuggestions && !isQueryOptimization && !isMultiQuery) {
      if (!messageId || typeof messageId !== "string") {
        await logValidationError(logger, "/api/ai-text-generation", "messageId", "Message ID is required");
        await flushLogs(logger);
        return NextResponse.json(
          { error: "Message ID is required" },
          { status: 400 }
        );
      }

      if (!threadId || typeof threadId !== "string") {
        await logValidationError(logger, "/api/ai-text-generation", "threadId", "Thread ID is required");
        await flushLogs(logger);
        return NextResponse.json(
          { error: "Thread ID is required" },
          { status: 400 }
        );
      }
    }

    // Main logic wrapped in try-catch
    try {
      if (isEnhancement) {
      // Prompt enhancement using Gemini 2.5 Flash Lite (free model)
      const { text: enhancedPrompt } = await generateText({
        model: openrouter("google/gemini-2.5-flash-lite"),
        system: `You are a PROMPT REWRITER. You MUST follow these rules EXACTLY:

WHAT YOU MUST DO:
1. Take the user's input and rewrite it to be clearer
2. Fix spelling and grammar mistakes
3. Make vague questions more specific
4. Add helpful details to make the prompt better
5. Keep the same intent - if they're asking a question, keep it as a question
6. If context shows an ongoing conversation, make the prompt fit that context

WHAT YOU MUST NEVER DO:
1. NEVER provide answers or information
2. NEVER explain things
3. NEVER say "I am" or "I can" or give any response
4. NEVER add your own knowledge or facts
5. NEVER turn a question into a statement
6. NEVER add content that answers the question

EXAMPLES OF CORRECT ENHANCEMENT:
Input: "wut is gpt"
Output: "What is GPT and how does it work?"

Input: "tell me about urself"  
Output: "Could you tell me about yourself, your capabilities, and what you can help with?"

Input: "how to code"
Output: "How can I learn to code? What programming language should I start with?"

Input: "hi how are you tell me about you"
Output: "Hello! How are you today? Could you introduce yourself and explain what you do?"

${
  context
    ? `\nCONVERSATION CONTEXT (use this to make the enhanced prompt more relevant):\n${context}\n`
    : ""
}

THE USER'S PROMPT TO ENHANCE (DO NOT ANSWER IT, ONLY REWRITE IT):
"${prompt}"

OUTPUT THE ENHANCED PROMPT ONLY. NO EXPLANATIONS. NO ANSWERS.`,
        prompt: "",
        temperature: 0.2,
        maxTokens: 200,
      });

      // Log success
      await logApiRequestSuccess(logger, "/api/ai-text-generation", {
        requestType: "enhancement",
        originalLength: prompt?.length || 0,
        enhancedLength: enhancedPrompt?.length || 0,
      });
      await flushLogs(logger);

      return NextResponse.json({ enhancedPrompt, isEnhancement });
    } else if (isSuggestions) {
      const count = Math.min(Math.max(Number(suggestionCount) || 4, 3), 6);
      if (!userQuestion || !aiAnswer) {
        return NextResponse.json(
          { error: "userQuestion and aiAnswer are required for suggestions" },
          { status: 400 }
        );
      }

      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash-lite"),
        system: `You write short, specific follow-up questions to continue a conversation based only on the provided pair of messages. Return ONLY a JSON array of strings, nothing else. Each question should be < 120 chars.`,
        prompt: `USER_QUESTION:\n${userQuestion}\n\nAI_ANSWER:\n${aiAnswer}\n\nReturn ${count} follow-up questions as a JSON array of strings.`,
        temperature: 0.4,
        maxTokens: 200,
      });

      let suggestions: string[] = [];
      const cleanItem = (s: string) =>
        s.replace(/^["'\s]+|["'\s,]+$/g, "").trim();

      // Remove code fences and language tags
      const candidate = text
        .replace(/```[a-zA-Z]+/g, "```")
        .replace(/```/g, "")
        .trim();

      // Try to extract JSON array between [ ... ]
      const start = candidate.indexOf("[");
      const end = candidate.lastIndexOf("]");
      if (start !== -1 && end !== -1 && end > start) {
        const slice = candidate.slice(start, end + 1);
        try {
          const parsed = JSON.parse(slice);
          if (Array.isArray(parsed)) {
            suggestions = parsed
              .filter((q: any) => typeof q === "string")
              .map((q: string) => cleanItem(q));
          }
        } catch {}
      }

      // Fallback: pull out quoted strings
      if (suggestions.length === 0) {
        const quoted = candidate.match(/"([^"]{1,200}?)"/g);
        if (quoted && quoted.length > 0) {
          suggestions = quoted.map((q) => cleanItem(q));
        }
      }

      // Fallback: line by line cleanup (remove bullets/brackets/artifacts)
      if (suggestions.length === 0) {
        suggestions = candidate
          .split("\n")
          .map((s: string) => s.replace(/^[\[\]\s]*/g, ""))
          .map((s: string) => s.replace(/^[\-\*\+\d.\s]+/, ""))
          .map((s: string) => s.replace(/^["']|["'],?$/g, ""))
          .map((s: string) => s.trim())
          .filter(
            (s: string) =>
              s && s.toLowerCase() !== "json" && s !== "[" && s !== "]"
          );
      }

      // Final cleanup: unique, length limit, slice to count
      const seen = new Set<string>();
      suggestions = suggestions
        .map(cleanItem)
        .filter((s) => s && !seen.has(s) && s.length <= 200)
        .map((s) => s.replace(/\s{2,}/g, " "))
        .filter((s) => {
          seen.add(s);
          return true;
        })
        .slice(0, count);

      // Log success
      await logApiRequestSuccess(logger, "/api/ai-text-generation", {
        requestType: "suggestions",
        suggestionCount: suggestions.length,
      });
      await flushLogs(logger);

      return NextResponse.json({ suggestions, isSuggestions: true });
    } else if (isQueryOptimization) {
      // Query optimization for study mode image search
      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash-lite"),
        system: `You are a search query optimizer. Extract key topics and visual concepts from the document to create a focused search query for finding relevant images. Keep it under 300 characters. Return ONLY the search query, nothing else.`,
        prompt,
        maxTokens: 100,
        temperature: 0.3,
      });

      // Log success
      await logApiRequestSuccess(logger, "/api/ai-text-generation", {
        requestType: "query-optimization",
        queryLength: text?.length || 0,
      });
      await flushLogs(logger);

      return NextResponse.json({ text, isQueryOptimization: true });
    } else if (isMultiQuery) {
      // Multi-query generation for web search
      const { text } = await generateText({
        model: openrouter("google/gemini-2.5-flash-lite"),
        system: `You are a search query generator. Generate 3-5 diverse search queries based on the user's question.

RULES:
- Generate between 3 to 5 queries (minimum 3, maximum 5)
- First query should be the main objective/question
- Other queries should explore different aspects or related topics
- Keep each query under 200 characters
- Use the same language as the user's question
- Include year or "latest" for time-sensitive queries
- Return ONLY a JSON array of strings, nothing else

Example:
User: "What is the latest news about AI?"
Output: ["Latest AI news 2025", "Recent artificial intelligence developments", "AI breakthroughs this year", "Current AI technology trends"]`,
        prompt,
        maxTokens: 300,
        temperature: 0.4,
      });

      // Parse the queries
      let queries: string[] = [];
      const cleanItem = (s: string) => s.replace(/^["'\s]+|["'\s,]+$/g, "").trim();

      // Remove code fences
      const candidate = text.replace(/```[a-zA-Z]+/g, "```").replace(/```/g, "").trim();

      // Try to extract JSON array
      const start = candidate.indexOf("[");
      const end = candidate.lastIndexOf("]");
      if (start !== -1 && end !== -1 && end > start) {
        const slice = candidate.slice(start, end + 1);
        try {
          const parsed = JSON.parse(slice);
          if (Array.isArray(parsed)) {
            queries = parsed
              .filter((q: any) => typeof q === "string")
              .map((q: string) => cleanItem(q))
              .slice(0, 5); // Max 5 queries
          }
        } catch {}
      }

      // Fallback: extract quoted strings
      if (queries.length === 0) {
        const quoted = candidate.match(/"([^"]{1,200}?)"/g);
        if (quoted && quoted.length > 0) {
          queries = quoted.map((q) => cleanItem(q)).slice(0, 5);
        }
      }

      // Ensure minimum 3 queries
      if (queries.length < 3) {
        queries = [prompt, prompt, prompt]; // Fallback to original prompt
      }

      // Log success
      await logApiRequestSuccess(logger, "/api/ai-text-generation", {
        requestType: "multi-query",
        queryCount: queries.length,
      });
      await flushLogs(logger);

      return NextResponse.json({ queries, isMultiQuery: true });
    } else {
      // Title generation (existing functionality) - handles both isTitle=true and undefined
      const { text: title } = await generateText({
        model: openrouter("openai/gpt-5-nano"),
        system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - if the user has attached files, consider them in the title (e.g., "Image analysis request", "PDF document review", etc.)
      - you should NOT answer the user's message, you should only generate a summary/title
      - do not use quotes or colons`,
        prompt,
      });

      // Log success
      await logApiRequestSuccess(logger, "/api/ai-text-generation", {
        requestType: "title",
        titleLength: title?.length || 0,
      });
      await flushLogs(logger);

        return NextResponse.json({ title, isTitle, messageId, threadId });
      }
    } catch (error) {
      console.error("Failed to generate:", error);

      // Log error with request type from outer scope
      await logApiRequestError(logger, "/api/ai-text-generation", error, {
        requestType,
      });
      await flushLogs(logger);

      return NextResponse.json(
        {
          error: requestType === "enhancement"
            ? "Failed to enhance prompt"
            : "Failed to generate title",
        },
        { status: 500 }
      );
    }
  } catch (outerError) {
    // Handle errors from the outer try block (e.g., JSON parsing)
    console.error("Failed to process request:", outerError);
    await logApiRequestError(logger, "/api/ai-text-generation", outerError);
    await flushLogs(logger);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
