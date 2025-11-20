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
import { checkGuestRateLimit } from "@/lib/guestRateLimit";
import {
  createBetterStackLogger,
  logApiRequestStart,
  logApiRequestSuccess,
  logApiRequestError,
  logCreditConsumption,
  flushLogs,
} from "@/lib/betterstack-logger";

export const maxDuration = 60;

// GET endpoint for prefetching images
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

    // Study mode: 5 results max for focused learning
    const tavilyResponse: any = await tvly.search(q, {
      search_depth: "basic",
      max_results: 5,
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
  const logger = createBetterStackLogger('study-mode');
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

    await logApiRequestStart(logger, '/api/study-mode', {
      userId: userId || 'guest',
      model: model || 'Gemini 2.5 Flash Lite',
      isGuest: !!isGuest,
      messageCount: messages?.length || 0,
    });

    // Guest rate limiting
    if (isGuest) {
      const rateLimitResponse = await checkGuestRateLimit(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

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

    // Guest users cannot use study mode - block access
    if (isGuest) {
      return new Response(
        JSON.stringify({
          error:
            "Study Mode is not available for guest users. Please sign up to use this feature.",
          code: "GUEST_STUDY_MODE_RESTRICTED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user can use this model (tier validation)
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

    // Build search query: combine user message with PDF/document content if present
    let searchQuery = lastUserMessage.content;
    let fullDocumentContent = ""; // Store full content for LLM

    // Check if last message has text/document attachments with content
    if (lastUserMessage.experimental_attachments && Array.isArray(lastUserMessage.experimental_attachments)) {
      const textAttachments = lastUserMessage.experimental_attachments.filter(
        (att: any) => (att.fileType === "text" || att.fileType === "document" || att.fileType === "pdf") && att.textContent
      );

      if (textAttachments.length > 0) {
        // Get full document content
        fullDocumentContent = textAttachments
          .map((att: any) => att.textContent)
          .join("\n\n");

        devLog(`📚 Study Mode: Found ${textAttachments.length} document(s) with ${fullDocumentContent.length} chars`);

        // Use ai-text-generation endpoint to optimize search query for better images
        try {
          devLog(`📚 Study Mode: Generating optimized search query...`);

          const summaryPrompt = `Create a concise search query (max 300 chars) for finding relevant images.

User Question: ${lastUserMessage.content}

Document: ${fullDocumentContent.substring(0, 2000)}

Focus on: main topic, key visual concepts, important keywords.
Return ONLY the search query.`;

          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-text-generation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: summaryPrompt,
              isQueryOptimization: true,
              userApiKey,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const optimizedQuery = data.text?.trim() || "";

            if (optimizedQuery && optimizedQuery.length > 0) {
              searchQuery = optimizedQuery;
              devLog(`📚 Study Mode: Optimized query: "${searchQuery}"`);
            } else {
              searchQuery = `${lastUserMessage.content}\n\n${fullDocumentContent}`;
            }
          } else {
            searchQuery = `${lastUserMessage.content}\n\n${fullDocumentContent}`;
          }
        } catch (error) {
          devError(`📚 Study Mode: Query optimization error:`, error);
          searchQuery = `${lastUserMessage.content}\n\n${fullDocumentContent}`;
        }
      }
    }

    devLog(`📚 Study Mode: Final search query length: ${searchQuery.length} chars`);

    // Use user's Tavily API key if provided, otherwise fall back to system key
    const tavilyApiKey = userTavilyApiKey || process.env.TAVILY_API_KEY;
    const usingUserTavilyKey = !!userTavilyApiKey;

    devLog(
      `📚 Tavily API key source: ${usingUserTavilyKey ? "User BYOK" : "System"}`
    );

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
      devLog(`📚 Performing Tavily search for study mode: "${searchQuery}"`);

      // Truncate query for Tavily (400 char limit) while keeping full query for LLM
      const truncatedQuery = searchQuery.length > 400 ? searchQuery.substring(0, 400) : searchQuery;
      devLog(`📚 Truncated query for Tavily: "${truncatedQuery}"`);

      // Add timeout wrapper to prevent hanging on Tavily search
      const searchTimeout = new Promise<never>(
        (_, reject) =>
          setTimeout(() => reject(new Error("Tavily search timeout")), 15000)
      );

      // Study mode: limit to 5 results for focused learning
      const searchPromise = tvly.search(truncatedQuery, {
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
        include_images: true,
      });

      const tavilyResponse = await Promise.race([searchPromise, searchTimeout]);

      // Extract image URLs from Tavily response
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
        devLog(`🖼️ Study Mode: Images extracted: ${imageUrls.length}`);
      } catch (e) {
        devWarn("Failed to parse Tavily images array", e);
        imageUrls = [];
      }

      searchResults = tavilyResponse.results || [];
      devLog(
        `✅ Study Mode: Tavily search completed. Found ${searchResults.length} results`
      );
    } catch (error) {
      prodError("Study Mode: Tavily search error", error, "StudyModeAPI");

      let errorMessage = "Study Mode search failed. Please try again later.";
      if (error instanceof Error && error.message.includes("timeout")) {
        errorMessage =
          "Study Mode search timed out. Please try again with a more specific query.";
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

    // Consume credits for the LLM model with timeout protection
    try {
      const creditTimeout = new Promise<boolean>(
        (_, reject) =>
          setTimeout(
            () => reject(new Error("Credit consumption timeout")),
            10000
          )
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
            error: "Insufficient credits for Study Mode",
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

      if (error instanceof Error && error.message.includes("timeout")) {
        devWarn("Credit consumption timed out, continuing with Study Mode...");
      } else {
        await logApiRequestError(logger, '/api/study-mode', error, {
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
      `📚 Study Mode credits consumed for user ${userId} using model ${selectedModel}`
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

    devLog("🔗 Study Mode: Search URLs for citations:", searchUrls);

    // Collect text/document files from conversation history
    const conversationFiles: Array<{
      fileName: string;
      fileType: string;
      textContent: string;
      messageRole: string;
    }> = [];

    messages.forEach((message: Record<string, unknown>) => {
      if (
        message.experimental_attachments &&
        Array.isArray(message.experimental_attachments)
      ) {
        message.experimental_attachments.forEach(
          (attachment: Record<string, unknown>) => {
            const fileType = attachment.fileType as string;
            if (
              (fileType === "text" || fileType === "document") &&
              attachment.textContent
            ) {
              conversationFiles.push({
                fileName: attachment.originalName as string,
                fileType: fileType,
                textContent: attachment.textContent as string,
                messageRole: message.role as string,
              });
            }
          }
        );
      }
    });

    devLog(
      `📂 Study Mode: Collected ${conversationFiles.length} files from conversation`
    );

    // Process messages to handle attachments (same as chat-messaging)
    const processedMessages = messages.map(
      (message: Record<string, unknown>) => {
        if (
          message.experimental_attachments &&
          Array.isArray(message.experimental_attachments) &&
          message.experimental_attachments.length > 0
        ) {
          // Separate text/document attachments from other attachments
          const textAttachments: any[] = [];
          const otherAttachments: any[] = [];

          message.experimental_attachments.forEach(
            (attachment: Record<string, unknown>) => {
              const fileType = attachment.fileType as string;

              if (fileType === "text" || fileType === "document") {
                textAttachments.push(attachment);
              } else {
                otherAttachments.push(attachment);
              }
            }
          );

          // Build message content with text attachments included
          let messageContent = message.content as string;

          if (textAttachments.length > 0) {
            const fileNames = textAttachments.map(
              (attachment: Record<string, unknown>) => {
                const fileName = attachment.originalName as string;
                const fileType = attachment.fileType as string;
                const fileTypeLabel =
                  fileType === "text" ? "text file" : "document";
                return `${fileTypeLabel} "${fileName}"`;
              }
            );

            messageContent =
              messageContent + `\n\n[User uploaded: ${fileNames.join(", ")}]`;
          }

          // Convert remaining attachments to AI SDK format (only non-text files)
          const aiSdkAttachments = otherAttachments.map(
            (attachment: Record<string, unknown>) => ({
              name: (attachment.originalName || attachment.filename) as string,
              contentType: (attachment.mimeType ||
                attachment.contentType) as string,
              url: attachment.url as string,
            })
          );

          return {
            ...message,
            content: messageContent,
            // Only pass non-text attachments to the AI model
            experimental_attachments:
              aiSdkAttachments.length > 0 ? aiSdkAttachments : undefined,
          };
        }
        return message;
      }
    ) as Parameters<typeof streamText>[0]["messages"];

    // Build system prompt with file context
    let systemPrompt = `
      ${styleConfig.systemPrompt}

      You are CappyChat in STUDY MODE - an expert AI tutor designed to help students learn effectively and retain knowledge.
      You have access to real-time web search results to provide accurate, up-to-date educational content.

      SEARCH RESULTS FOR: "${searchQuery}"
      ${searchContext}`;

    // Add conversation file context if there are uploaded files
    if (conversationFiles.length > 0) {
      devLog(
        `📁 Study Mode: Adding ${conversationFiles.length} files to context`
      );

      systemPrompt += `\n\n--- UPLOADED FILES IN THIS CONVERSATION ---`;
      systemPrompt += `\nThe user has uploaded the following files in this conversation:`;

      conversationFiles.forEach((file, index) => {
        const fileTypeLabel =
          file.fileType === "text" ? "text file" : "document";
        systemPrompt += `\n\n${index + 1}. ${fileTypeLabel}: "${file.fileName}"`;
        systemPrompt += `\nContent:\n${file.textContent}`;
      });

      systemPrompt += `\n\nWhen the user refers to "this file", "the file", "uploaded file", or mentions a specific filename, they are referring to one of these uploaded files. You can directly reference and work with the content shown above.`;
      systemPrompt += `\n--- END UPLOADED FILES ---\n`;
    }

    systemPrompt += `

      ═══════════════════════════════════════════════════════════════════════════
      YOUR ROLE AS AN EXPERT EDUCATIONAL TUTOR
      ═══════════════════════════════════════════════════════════════════════════

      You are a master educator who:
      ✓ Synthesizes web search results with deep subject knowledge
      ✓ Adapts explanations to different learning styles
      ✓ Uses proven pedagogical techniques for maximum retention
      ✓ Makes complex topics accessible and engaging
      ✓ Provides practical study strategies and memory aids

      ═══════════════════════════════════════════════════════════════════════════
      COMPREHENSIVE TEACHING FRAMEWORK
      ═══════════════════════════════════════════════════════════════════════════

      📚 **1. STRUCTURED EXPLANATION**
      - Start with a clear, concise definition or overview
      - Explain WHY this topic matters (real-world relevance)
      - Break down into logical, digestible sections
      - Build from fundamentals to advanced concepts progressively
      - Use clear headings and organization

      🎯 **2. MULTIPLE LEARNING STYLES**
      Support different learners by including:
      - **Visual**: Describe diagrams, charts, or visual patterns
      - **Verbal**: Use clear explanations and definitions
      - **Practical**: Provide hands-on examples and applications
      - **Logical**: Show step-by-step reasoning and connections

      💡 **3. POWERFUL EXAMPLES & ANALOGIES**
      - Provide 2-3 concrete, relatable examples
      - Use analogies that connect to everyday experiences
      - Include real-world applications and case studies
      - Show both simple and complex examples
      - Reference examples from the search results when available

      🧠 **4. MEMORY TECHNIQUES & STUDY AIDS**
      Help students remember by providing:
      - **Mnemonics**: Create memorable acronyms or phrases
      - **Chunking**: Break information into manageable pieces
      - **Patterns**: Highlight patterns and relationships
      - **Key Points**: Summarize essential takeaways in bullet points
      - **Visual Cues**: Describe mental images or memory palaces

      ⚠️ **5. COMMON MISTAKES & MISCONCEPTIONS**
      - Identify typical errors students make
      - Explain WHY these misconceptions occur
      - Provide clear corrections with explanations
      - Offer tips to avoid these pitfalls

      🔢 **6. STEP-BY-STEP PROBLEM SOLVING**
      When applicable:
      - Show worked examples with detailed steps
      - Explain the reasoning behind each step
      - Provide practice problems at different difficulty levels
      - Include tips for approaching similar problems

      🔗 **7. CONCEPT CONNECTIONS**
      - Link to prerequisite knowledge
      - Show how this connects to related topics
      - Explain broader implications and applications
      - Suggest logical next topics to study

      ❓ **8. ACTIVE LEARNING QUESTIONS**
      Throughout your response:
      - Ask thought-provoking questions to check understanding
      - Encourage critical thinking and deeper analysis
      - Suggest self-testing questions for practice
      - Provide questions at different cognitive levels (recall, application, analysis)

      📖 **9. STUDY STRATEGIES**
      Recommend effective study techniques:
      - Active recall methods
      - Spaced repetition schedules
      - Practice test strategies
      - Note-taking approaches
      - Review and consolidation tips

      🎓 **10. SUMMARY & NEXT STEPS**
      End with:
      - **Key Takeaways**: 3-5 bullet points of essential information
      - **Quick Review**: One-sentence summary
      - **Practice Suggestions**: Specific exercises or activities
      - **Further Exploration**: Related topics to study next
      - **Self-Assessment**: Questions to test their understanding

      ═══════════════════════════════════════════════════════════════════════════
      FORMATTING GUIDELINES
      ═══════════════════════════════════════════════════════════════════════════

      📐 **Mathematical Expressions** (use LaTeX):
      - Inline math: $E = mc^2$ (wrapped in single $)
      - Display math: $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$ (wrapped in double $$, on its own line)
      - Never nest delimiters or mix styles

      📝 **Text Formatting**:
      - Use **bold** for key terms and important concepts
      - Use *italics* for emphasis
      - Use bullet points and numbered lists for clarity
      - Use emojis sparingly for visual organization (✓, ⚠️, 💡, etc.)
      - Use clear section headings

      🔗 **Citations**:
      - Reference sources naturally in your explanation
      - Include clickable URLs when citing information
      - Cross-reference multiple sources for balanced perspectives
      - Available sources: ${searchUrls.join(", ")}

      ═══════════════════════════════════════════════════════════════════════════
      EXAMPLE RESPONSE STRUCTURE
      ═══════════════════════════════════════════════════════════════════════════

      ## [Topic Name]

      ### 📖 What is it?
      [Clear definition and overview]

      ### 🎯 Why does it matter?
      [Real-world relevance and applications]

      ### 🔍 Deep Dive
      [Detailed explanation with subsections]

      ### 💡 Examples
      [2-3 concrete examples with explanations]

      ### 🧠 Memory Aid
      [Mnemonic, acronym, or memory technique]

      ### ⚠️ Common Mistakes
      [Typical errors and how to avoid them]

      ### 🔢 Practice Problem (if applicable)
      [Worked example with step-by-step solution]

      ### 🔗 Connections
      [How this relates to other concepts]

      ### ✅ Key Takeaways
      - [Essential point 1]
      - [Essential point 2]
      - [Essential point 3]

      ### 🎓 Study Tips
      [Specific strategies for mastering this topic]

      ### 🚀 Next Steps
      [Suggested topics to explore next]

      ### ❓ Test Your Understanding
      [2-3 questions for self-assessment]

      ═══════════════════════════════════════════════════════════════════════════

      CRITICAL REQUIREMENTS:
      1. Synthesize information from search results with your knowledge
      2. Make content engaging, clear, and student-friendly
      3. Include practical study aids and memory techniques
      4. Provide examples that students can relate to
      5. End with actionable next steps and self-assessment questions

      You MUST end your response with exactly these two lines:
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
      onFinish: async (result) => {
        devLog(
          "📚 Study Mode response finished. Text length:",
          result.text.length
        );

        // Log success
        await logApiRequestSuccess(logger, '/api/study-mode', {
          userId: userId || 'unknown',
          model: selectedModel,
          textLength: result.text.length,
        });
        await flushLogs(logger);
      },
      system: systemPrompt,
      experimental_transform: [smoothStream({ chunking: "word" })],
      abortSignal: req.signal,
    });

    return result.toTextStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
    });
  } catch (error) {
    devLog("error", error);
    await logApiRequestError(logger, '/api/study-mode', error, {
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

