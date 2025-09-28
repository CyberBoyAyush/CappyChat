import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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
  } = body;

  // AI text generation is completely free - no tier validation or credit consumption
  console.log(
    "📝 AI text generation - completely free service (no credits consumed)"
  );

  // Use user's API key if provided, otherwise fall back to system key
  const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
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

  // Validate required fields (skip for suggestions)
  if (!isEnhancement && !isSuggestions) {
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }
  }

  // For enhancement or suggestions, we don't need messageId and threadId
  if (!isEnhancement && !isSuggestions) {
    if (!messageId || typeof messageId !== "string") {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    if (!threadId || typeof threadId !== "string") {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }
  }

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

      return NextResponse.json({ suggestions, isSuggestions: true });
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

      return NextResponse.json({ title, isTitle, messageId, threadId });
    }
  } catch (error) {
    console.error("Failed to generate:", error);
    return NextResponse.json(
      {
        error: isEnhancement
          ? "Failed to enhance prompt"
          : "Failed to generate title",
      },
      { status: 500 }
    );
  }
}
