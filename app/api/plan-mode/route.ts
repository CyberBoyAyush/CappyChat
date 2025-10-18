import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream, tool } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getModelConfig, AIModel } from "@/lib/models";
import {
  canUserUseModel,
  consumeCredits,
  consumeToolCredits,
} from "@/lib/tierSystem";
import { devWarn, devError } from "@/lib/logger";
import { Client, Databases, ID, Query } from "node-appwrite";
import { DATABASE_ID, PLAN_ARTIFACTS_COLLECTION_ID } from "@/lib/appwriteDB";
import { executeRetrieval } from "@/lib/tools/actions";

export const maxDuration = 60;

// Tools are constructed inside the POST handler to capture request-scoped context

// Analyze conversation to provide intelligent context hints
function analyzeConversationContext(messages: any[]): {
  discussionCount: number;
  hasDetailedRequirements: boolean;
  suggestArtifacts: boolean;
  contextHint: string;
} {
  const userMessages = messages.filter((m) => m.role === "user");
  const discussionCount = userMessages.length;

  // Get last few user messages to analyze
  const recentUserMessages = userMessages
    .slice(-3)
    .map((m) => m.content?.toLowerCase() || "");
  const lastUserMessage =
    recentUserMessages[recentUserMessages.length - 1] || "";

  // Check if user has provided detailed requirements
  const hasDetailedRequirements =
    lastUserMessage.length > 100 ||
    recentUserMessages.some(
      (msg) =>
        msg.includes("feature") ||
        msg.includes("requirement") ||
        msg.includes("should have") ||
        msg.includes("need to") ||
        msg.includes("want it to")
    );

  // Check if user seems ready for artifacts
  const explicitCreationRequest =
    lastUserMessage.includes("create") ||
    lastUserMessage.includes("build") ||
    lastUserMessage.includes("generate") ||
    lastUserMessage.includes("make") ||
    lastUserMessage.includes("show me") ||
    lastUserMessage.includes("implement");

  // Check if this is a follow-up after discussion (3+ messages and detailed requirements)
  const isFollowUpAfterDiscussion =
    discussionCount >= 3 && hasDetailedRequirements;

  // Suggest artifacts if:
  // 1. User explicitly requests, OR
  // 2. It's a follow-up with detailed requirements
  const suggestArtifacts = explicitCreationRequest || isFollowUpAfterDiscussion;

  let contextHint = "";
  if (discussionCount === 1 && !explicitCreationRequest) {
    contextHint =
      "First message - focus on understanding requirements through discussion.";
  } else if (
    discussionCount >= 2 &&
    discussionCount <= 3 &&
    !explicitCreationRequest
  ) {
    contextHint =
      "Early discussion phase - continue gathering requirements. Offer to create artifacts once requirements are clear.";
  } else if (isFollowUpAfterDiscussion && !explicitCreationRequest) {
    contextHint =
      "User has discussed requirements extensively. Consider offering: 'Would you like me to create [specific artifacts] based on what we've discussed?'";
  } else if (explicitCreationRequest) {
    contextHint =
      "User explicitly requested artifact creation - proceed with creating appropriate artifacts.";
  }

  return {
    discussionCount,
    hasDetailedRequirements,
    suggestArtifacts,
    contextHint,
  };
}

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  let model: string | undefined;
  let threadId: string | undefined;
  let assistantMessageId: string | undefined;

  try {
    const body = await req.json();
    const {
      messages,
      model: requestModel,
      userApiKey,
      userId: requestUserId,
      isGuest,
      threadId: requestThreadId,
      assistantMessageId: requestAssistantMessageId,
      id: chatId,
    } = body;

    userId = requestUserId;
    model = requestModel;
    threadId = requestThreadId || chatId;
    assistantMessageId = requestAssistantMessageId;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (isGuest) {
      return new Response(
        JSON.stringify({
          error:
            "Plan mode is not available for guest users. Please sign up to use this feature.",
          code: "GUEST_PLAN_MODE_RESTRICTED",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!assistantMessageId || typeof assistantMessageId !== "string") {
      return new Response(
        JSON.stringify({
          error:
            "assistantMessageId is required so artifacts can be linked to the assistant response.",
          code: "MISSING_ASSISTANT_ID",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Require explicit user-selected model for Plan Mode (no default)
    if (!model || typeof model !== "string" || model.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Model is required for Plan Mode" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const selectedModel = model as string;
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

    // Plan Mode allowed models whitelist
    const PLAN_MODE_ALLOWED_MODELS = [
      "Claude Haiku 4.5",
      "Claude Sonnet 4.5",

      "Grok Code Fast 1",
    ];
    if (!PLAN_MODE_ALLOWED_MODELS.includes(selectedModel)) {
      return new Response(
        JSON.stringify({
          error:
            "The selected model is not available in Plan Mode. Please choose from the available Plan Mode models.",
          code: "MODEL_NOT_ALLOWED_IN_PLAN_MODE",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "OpenRouter API key not configured. Please add your API key in Settings → Application.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openrouter = createOpenRouter({
      apiKey,
      headers: {
        "HTTP-Referer": "https://cappychat.com/",
        "X-Title": "CappyChat - Plan Mode",
        "User-Agent": "CappyChat/1.0.0",
      },
    });
    const aiModel = openrouter(modelConfig.modelId);

    // Initialize server-side Appwrite client for artifact persistence
    const serverClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
      .setKey(process.env.APPWRITE_API_KEY || "");
    const serverDatabases = new Databases(serverClient);

    const computeArtifactVersion = async (ctx: {
      userId: string;
      threadId: string;
      title: string;
      type: "mvp" | "diagram";
    }): Promise<{ version: number; parentArtifactId?: string } | null> => {
      try {
        const existing = await serverDatabases.listDocuments(
          DATABASE_ID,
          PLAN_ARTIFACTS_COLLECTION_ID,
          [
            Query.equal("userId", ctx.userId),
            Query.equal("threadId", ctx.threadId),
            Query.equal("title", ctx.title),
            Query.equal("type", ctx.type),
            Query.orderDesc("version"),
            Query.limit(1),
          ]
        );

        if (existing.documents.length === 0) {
          return { version: 1 };
        }

        const latest = existing.documents[0] as any;
        const nextVersion = Number(latest.version || 0) + 1;
        const parentArtifactId = latest.artifactId as string | undefined;
        return {
          version:
            Number.isFinite(nextVersion) && nextVersion > 0 ? nextVersion : 1,
          parentArtifactId,
        };
      } catch (err) {
        devWarn(
          "Failed to compute plan artifact version, defaulting to v1",
          err
        );
        return { version: 1 };
      }
    };

    const persistPlanArtifact = async (
      ctx: {
        userId?: string;
        threadId?: string;
        assistantMessageId?: string;
      },
      payload: {
        type: "mvp" | "diagram";
        title: string;
        description?: string;
        data: {
          framework?: string;
          theme?: string;
          htmlCode?: string;
          cssCode?: string;
          jsCode?: string;
          diagramType?: string;
          diagramCode?: string;
          outputFormat?: string;
          sqlSchema?: string;
          prismaSchema?: string;
          typeormEntities?: string;
          diagramSvg?: string;
          mermaidCode?: string;
          d3Code?: string;
        };
      }
    ) => {
      const { userId: uId, threadId: tId, assistantMessageId: mId } = ctx;
      if (!uId || !tId || !mId) {
        devWarn("Missing context to persist plan artifact", {
          hasUserId: !!uId,
          hasThreadId: !!tId,
          hasAssistantId: !!mId,
        });
        return null;
      }

      // Validate required payload fields
      if (!payload.title || !payload.type) {
        devWarn("Missing required payload fields", {
          hasTitle: !!payload.title,
          hasType: !!payload.type,
        });
        return null;
      }

      const versionMeta = await computeArtifactVersion({
        userId: uId,
        threadId: tId,
        title: payload.title,
        type: payload.type,
      });

      const documentId = ID.unique();
      const artifactId = documentId;
      try {
        await serverDatabases.createDocument(
          DATABASE_ID,
          PLAN_ARTIFACTS_COLLECTION_ID,
          documentId,
          {
            artifactId,
            threadId: tId,
            messageId: mId,
            userId: uId,
            type: payload.type,
            title: payload.title,
            description: payload.description || undefined,
            framework: payload.data.framework || undefined,
            theme: payload.data.theme || undefined,
            htmlCode: payload.data.htmlCode || undefined,
            cssCode: payload.data.cssCode || undefined,
            jsCode: payload.data.jsCode || undefined,
            diagramType: payload.data.diagramType || undefined,
            diagramCode: payload.data.diagramCode || undefined,
            outputFormat: payload.data.outputFormat || undefined,
            sqlSchema: payload.data.sqlSchema || undefined,
            prismaSchema: payload.data.prismaSchema || undefined,
            version: versionMeta?.version ?? 1,
            parentArtifactId: versionMeta?.parentArtifactId || undefined,
            isPublic: false,
          }
        );

        return {
          artifactId,
          version: versionMeta?.version ?? 1,
          parentArtifactId: versionMeta?.parentArtifactId,
          created: true,
        };
      } catch (error) {
        devError("Failed to persist plan artifact:", error);
        // Don't throw error - return null to indicate failure
        // The tool will still execute but with created: false
        return null;
      }
    };

    const ensureToolCredits = async (
      ctx: {
        selectedModel?: AIModel;
        usingBYOK?: boolean;
        userId?: string;
        isGuest?: boolean;
      },
      amount: number
    ) => {
      if (!ctx.selectedModel || !ctx.userId) return true;
      try {
        const ok = await consumeToolCredits(
          ctx.selectedModel,
          amount,
          ctx.usingBYOK,
          ctx.userId,
          ctx.isGuest
        );
        if (!ok) {
          const error = new Error("Insufficient plan-mode credits");
          (error as any).code = "INSUFFICIENT_TOOL_CREDITS";
          throw error;
        }
        return true;
      } catch (error) {
        devWarn("Tool credit consumption failed", error);
        throw error;
      }
    };

    // Build Plan Mode tools with access to request context and server DB
    const buildPlanTools = (ctx: {
      userId?: string;
      threadId?: string;
      assistantMessageId?: string;
      selectedModel?: AIModel;
      usingBYOK?: boolean;
      isGuest?: boolean;
    }) => ({
      create_mvp: tool({
        description:
          "Generate a minimal MVP front-end artifact (HTML/CSS/JS). Returns structured code blocks and metadata.",
        parameters: z
          .object({
            title: z.string().min(3).describe("Project title"),
            description: z.string().min(5).describe("What to build"),
            framework: z
              .enum(["vanilla", "react", "svelte", "vue"])
              .default("vanilla"),
            theme: z.enum(["light", "dark"]).default("light"),
            features: z.array(z.string()).default([]),
            htmlCode: z
              .string()
              .min(1)
              .describe("Complete HTML document or fragment for the MVP"),
            cssCode: z.string().min(1).describe("Complete CSS for the MVP"),
            jsCode: z
              .string()
              .min(1)
              .describe("Complete JavaScript for the MVP"),
            deploymentNotes: z
              .string()
              .optional()
              .describe("Optional notes on how to run or deploy the MVP"),
            dependencies: z.array(z.string()).optional(),
          })
          .strict(),
        execute: async ({
          title,
          description,
          framework,
          theme,
          features,
          htmlCode,
          cssCode,
          jsCode,
          deploymentNotes,
          dependencies,
        }) => {
          await ensureToolCredits(ctx, 5);
          const persisted = await persistPlanArtifact(ctx, {
            type: "mvp",
            title,
            description,
            data: {
              framework,
              theme,
              htmlCode,
              cssCode,
              jsCode,
            },
          });

          return {
            type: "mvp",
            title,
            description,
            framework,
            theme,
            features,
            artifactId: persisted?.artifactId,
            version: persisted?.version ?? 1,
            created: !!persisted,
            dependencies,
            deploymentNotes,
          };
        },
      }),
      generate_diagram: tool({
        description:
          "Generate a Mermaid diagram artifact (ERD, flowchart, sequence, architecture, state machine, user journey).",
        parameters: z
          .object({
            type: z
              .enum([
                "erd",
                "flowchart",
                "sequence",
                "architecture",
                "state_machine",
                "user_journey",
              ])
              .describe("Diagram type"),
            title: z.string().min(3).describe("Diagram title"),
            description: z.string().min(5).describe("What to visualize"),
            diagramCode: z.string().min(1).describe("Mermaid diagram code"),
            sqlSchema: z
              .string()
              .optional()
              .describe("SQL schema (if applicable)"),
            prismaSchema: z
              .string()
              .optional()
              .describe("Prisma schema (if applicable)"),
          })
          .strict(),
        execute: async ({
          type,
          title,
          description,
          diagramCode,
          sqlSchema,
          prismaSchema,
        }) => {
          await ensureToolCredits(ctx, 3);
          const persisted = await persistPlanArtifact(ctx, {
            type: "diagram",
            title,
            description,
            data: {
              diagramType: type,
              diagramCode,
              outputFormat: "mermaid",
              sqlSchema,
              prismaSchema,
            },
          });

          return {
            type: "diagram",
            title,
            description,
            diagramType: type,
            artifactId: persisted?.artifactId,
            version: persisted?.version ?? 1,
            created: !!persisted,
            sqlSchema,
            prismaSchema,
          };
        },
      }),
      retrieval: tool({
        description:
          "Retrieve full content from a URL. Returns text, title, summary, and images. Use this when the user provides a URL or asks to analyze a specific website, domain, or online resource.",
        parameters: z
          .object({
            url: z
              .string()
              .describe(
                "The URL to retrieve content from (e.g., 'https://github.com', 'openai.com', 'example.com/blog')"
              ),
            include_summary: z
              .boolean()
              .optional()
              .describe("Include AI-generated summary (default: true)"),
            live_crawl: z
              .enum(["never", "auto", "preferred"])
              .optional()
              .describe("Crawl mode (default: preferred)"),
          })
          .strict(),
        execute: async ({ url, include_summary, live_crawl }) => {
          await ensureToolCredits(ctx, 1);
          return executeRetrieval({ url, include_summary, live_crawl });
        },
      }),
    });

    // Analyze conversation context to provide intelligent hints (before type assertion)
    const conversationContext = analyzeConversationContext(messages);

    const processedMessages = messages as Parameters<
      typeof streamText
    >[0]["messages"];

    // Consume base LLM credits (tool-specific credits handled on execute in follow-up)
    try {
      const ok = await consumeCredits(
        selectedModel as AIModel,
        usingBYOK,
        userId,
        isGuest
      );
      if (!ok && !usingBYOK) {
        return new Response(
          JSON.stringify({
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      devWarn("Plan mode credit consumption failed, proceeding anyway:", e);
    }

    const systemPrompt = `You are CappyChat's Plan Mode - a consultative planning assistant that creates artifacts when appropriate.

=== CONTEXT ===
${conversationContext.contextHint}
${
  conversationContext.suggestArtifacts
    ? "💡 User seems ready for artifacts - confirm unclear requirements first."
    : "💡 Focus on discussion and requirements gathering."
}
${
  conversationContext.discussionCount > 1
    ? `(Message #${conversationContext.discussionCount})`
    : ""
}

=== RESPONSE MODE ===
**TEXT ONLY (No tools):**
- Brainstorming, "what if" questions, conceptual discussions
- Advice, best practices, architecture comparisons
- Unclear/incomplete requirements - ask clarifying questions
- Greetings or capability questions

**CREATE ARTIFACTS (Use tools):**
- Explicit requests: "Create", "Generate", "Build", "Show me", "Implement"
- Clear, detailed requirements after discussion
- User confirmation after your suggestions

=== FLOW ===
1. **Discuss** → Understand vision
2. **Clarify** → Ask specific questions if vague
3. **Suggest** → Propose helpful artifacts
4. **Analyze URLs** → If user provides URLs, call retrieval first to gather accurate details
5. **Create** → Only when confirmed/requested

=== TOOL USAGE ===
**retrieval**: Web content analysis for URL-based requirements
- Use when user provides a URL, asks to analyze a website, or wants to replicate features from an existing site
- Fetches title, text content, summary, and images from the provided URL
- Call retrieval FIRST, then use the content to discuss features or to inform create_mvp or generate_diagram
- If retrieval fails, ask for another URL or proceed with available details

**create_mvp**: Include title, description, framework, theme, features, dependencies, deploymentNotes
- Generate FULL production code - no placeholders/TODOs
- **CSS**: ALWAYS use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- **JS**: If jsCode provided, HTML MUST include <script> tag executing it
- **DESIGN**: Create PROFESSIONAL, STUNNING UIs with modern patterns, animations, responsive layouts
- **RESPONSIVE**: Mobile-first (320px+), use Tailwind breakpoints (sm:, md:, lg:, xl:)
- **AESTHETICS**: Gradients, shadows (shadow-lg), rounded corners (rounded-xl), smooth transitions (transition-all duration-300)
- **SPACING**: Generous padding (p-6, p-8), consistent gaps (gap-6), section spacing (my-12)
- **INTERACTIONS**: Hover effects (hover:scale-105), focus states (focus:ring-2), visual feedback
- **ACCESSIBILITY**: Semantic HTML, ARIA labels, keyboard navigation, color contrast

**generate_diagram**: Include type, title, description, diagramCode (Mermaid syntax)
- For ERDs: Add sqlSchema/prismaSchema when user requests DB code
- Types: erd, flowchart, sequence, architecture, state_machine, user_journey

**After creating:**
- Brief summary
- Add: <!-- PLAN_ARTIFACT_AVAILABLE -->
- DON'T paste full code - let artifacts render
- Suggest next steps

=== DESIGN CHECKLIST ===
✓ Modern SaaS-quality UI?
✓ Fully responsive (mobile/tablet/desktop)?
✓ Smooth transitions & hover effects?
✓ Harmonious colors & proper spacing?
✓ Visual hierarchy & feedback?
✓ Production-ready code?

=== EXAMPLES ===
❌ User: "Thinking about todo app" → [Immediately creates MVP]
✅ User: "Thinking about todo app" → "What features? (CRUD, priority, due dates, auth, sync). Once clear, I'll create MVP + diagram."

❌ User: "Make dashboard" → [Creates generic dashboard]
✅ User: "Make dashboard" → "What data? Audience? Charts needed? Preferred style? I'll generate a custom MVP."

✅ User: "Create whiteboard app with touch + pen colors" → [Calls create_mvp] "Created interactive whiteboard with touch/mouse, colors, eraser. <!-- PLAN_ARTIFACT_AVAILABLE --> Want an architecture diagram?"

✅ User: "Create an MVP like https://example.com/blog" → [Calls retrieval] → [Calls create_mvp] "Analyzed the blog layout and created a modern version with similar features. <!-- PLAN_ARTIFACT_AVAILABLE -->"

❌ User: "Build something like twitter.com" → [Immediately creates MVP]
✅ User: "Build something like twitter.com" → [Calls retrieval] "Analyzed Twitter's core features. Should I create a social media MVP with feed, posts, and user profiles?"

REMEMBER: Be consultative first. Create production-quality, visually impressive UIs that look professionally designed, not basic templates.`;

    const result = streamText({
      model: aiModel,
      messages: processedMessages,
      tools: buildPlanTools({
        userId,
        threadId,
        assistantMessageId,
        selectedModel: selectedModel as AIModel,
        usingBYOK,
        isGuest,
      }),
      maxSteps: 5,
      onError: (error) => devError("Plan mode error:", error),
      system: systemPrompt,
      experimental_transform: [smoothStream({ chunking: "word" })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: false,
      getErrorMessage: (error) => {
        const errorMessage = (error as { message: string }).message;
        // Log the detailed error for debugging
        devError("Plan mode stream error:", error);

        // Check for specific error codes and return user-friendly messages
        if ((error as any).code === "INSUFFICIENT_TOOL_CREDITS") {
          return "Insufficient tool credits to complete this operation. Please check your plan mode credits.";
        }

        if ((error as any).code === "MODEL_NOT_ALLOWED_IN_PLAN_MODE") {
          return "This model is not available in Plan Mode.";
        }

        if ((error as any).code === "TIER_LIMIT_EXCEEDED") {
          return "Plan mode access denied. Please check your tier limits.";
        }

        // Return generic message for all other errors to avoid information disclosure
        return "An error occurred while processing your request. Please try again.";
      },
    });
  } catch (error) {
    devError("/api/plan-mode error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
