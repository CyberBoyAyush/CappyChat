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

      const versionMeta = await computeArtifactVersion({
        userId: uId,
        threadId: tId,
        title: payload.title,
        type: payload.type,
      });

      const artifactId = ID.unique();
      try {
        await serverDatabases.createDocument(
          DATABASE_ID,
          PLAN_ARTIFACTS_COLLECTION_ID,
          ID.unique(),
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
            typeormEntities: payload.data.typeormEntities || undefined,
            diagramSvg: payload.data.diagramSvg || undefined,
            mermaidCode: payload.data.mermaidCode || undefined,
            d3Code: payload.data.d3Code || undefined,
            version: versionMeta?.version ?? 1,
            parentArtifactId: versionMeta?.parentArtifactId || undefined,
            isPublic: false,
          }
        );

        return {
          artifactId,
          version: versionMeta?.version ?? 1,
          parentArtifactId: versionMeta?.parentArtifactId,
        };
      } catch (error) {
        devError("Failed to persist plan artifact:", error);
        throw error;
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
            dependencies,
            deploymentNotes,
          };
        },
      }),
      generate_diagram: tool({
        description:
          "Generate a diagram artifact (ERD, flowchart, sequence, architecture). Returns code in Mermaid/PlantUML/etc.",
        parameters: z.object({
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
          outputFormat: z.enum(["mermaid", "svg", "d3"]).default("mermaid"),
          diagramCode: z
            .string()
            .min(1)
            .describe("Generated diagram definition (Mermaid or other syntax)"),
          diagramSvg: z.string().optional(),
          mermaidCode: z.string().optional(),
          d3Code: z.string().optional(),
          sqlSchema: z.string().optional(),
          prismaSchema: z.string().optional(),
          typeormEntities: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async ({
          type,
          title,
          description,
          outputFormat,
          diagramCode,
          diagramSvg,
          mermaidCode,
          d3Code,
          sqlSchema,
          prismaSchema,
          typeormEntities,
        }) => {
          await ensureToolCredits(ctx, 3);
          const persisted = await persistPlanArtifact(ctx, {
            type: "diagram",
            title,
            description,
            data: {
              diagramType: type,
              diagramCode,
              outputFormat,
              sqlSchema,
              prismaSchema,
              typeormEntities,
              diagramSvg,
              mermaidCode,
              d3Code,
            },
          });

          return {
            type: "diagram",
            title,
            description,
            outputFormat,
            diagramType: type,
            artifactId: persisted?.artifactId,
            version: persisted?.version ?? 1,
            sqlSchema,
            prismaSchema,
            typeormEntities,
          };
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

    const systemPrompt = `
You are CappyChat's Plan Mode - an intelligent planning assistant that helps users think through ideas and create concrete artifacts when ready.

CRITICAL: Do NOT force artifact creation on every message! Be consultative first, then create artifacts when appropriate.

=== CONVERSATION CONTEXT ===
${conversationContext.contextHint}
${
  conversationContext.suggestArtifacts
    ? "💡 TIP: User seems ready for artifacts - but still ask if requirements are unclear!"
    : "💡 TIP: Focus on discussion and gathering requirements first."
}
${
  conversationContext.discussionCount > 1
    ? "(This is message #" +
      conversationContext.discussionCount +
      " in the conversation)"
    : ""
}

=== WHEN TO RESPOND WITH TEXT ONLY (No tools) ===
- User is brainstorming, exploring ideas, or asking "what if" questions
- User asks conceptual questions: "What features should X have?", "How does Y work?"
- User wants advice, best practices, architecture discussions, or comparisons
- User is refining requirements through conversation
- Requirements are unclear or incomplete - ask clarifying questions first!
- User greets you or asks general questions about capabilities

=== WHEN TO CREATE ARTIFACTS (Use tools) ===
- User EXPLICITLY requests: "Create MVP", "Generate diagram", "Build X", "Show me"
- User asks: "Can you make", "Implement", "Develop", "Design X for me"
- Discussion has concluded and user is ready for concrete implementation
- User provides detailed, clear requirements ready for implementation
- User confirms they want artifacts after your suggestions

=== INTERACTION FLOW ===
1. **Discuss First**: Start with questions and suggestions to understand the user's vision
2. **Clarify**: If requirements are vague, ask specific questions
3. **Suggest**: Propose what artifacts would be helpful
4. **Create**: Only call tools when the user confirms or explicitly requests

=== TOOL USAGE POLICY ===
When you DO create artifacts:
- **create_mvp**: ALWAYS include htmlCode, cssCode, jsCode fields with complete, working code
  - Include title, description, framework, theme, features
  - Add dependencies and deploymentNotes when relevant
  - Generate FULL, production-ready code - no placeholders or TODOs
  - **CRITICAL CSS REQUIREMENT**: ALWAYS use Tailwind CSS for styling. Include Tailwind CDN in the HTML head section.
  - **CRITICAL JS REQUIREMENT**: If you generate JavaScript code in jsCode field, you MUST include the <script> tag in the HTML body that references or executes that JavaScript. Never forget to include the JS script in the HTML!
  - **CRITICAL DESIGN REQUIREMENT**: Create PROFESSIONAL, VISUALLY STUNNING UIs with modern design patterns, smooth animations, responsive layouts, and creative aesthetics. NOT basic templates!
  - Ensure the HTML structure is semantic and accessible with proper ARIA labels

- **generate_diagram**: ALWAYS include diagramCode with complete definition
  - Include type, title, description, outputFormat
  - Provide diagramSvg and/or mermaidCode/d3Code when available
  - For ERDs: Include matching sqlSchema/prisma/typeorm entities when the user asks for database code; otherwise diagramCode alone is acceptable
  - Use proper Mermaid syntax for flowcharts, sequence diagrams, etc.

After creating artifacts:
- Provide brief summary of what you created
- Include hidden marker: <!-- PLAN_ARTIFACT_AVAILABLE -->
- DO NOT paste the full code in chat - let artifacts speak for themselves
- Suggest next steps or offer to refine

=== BEST PRACTICES ===
1. Prefer 1-2 focused, high-quality artifacts per turn
2. Keep explanations concise and actionable
3. Ask before creating if the user's intent is unclear
4. For follow-ups, refine existing artifacts or add complementary ones
5. Be helpful and conversational - you're a planning partner, not just a code generator

=== EXAMPLE INTERACTIONS ===

❌ BAD (forcing artifacts):
User: "I'm thinking about a todo app"
Assistant: [Immediately calls create_mvp]

✅ GOOD (consultative):
User: "I'm thinking about a todo app"
Assistant: "Great idea! Let's plan this out. What features are you envisioning? Some common ones:
- Basic CRUD for tasks
- Priority levels or categories
- Due dates and reminders
- User authentication for multi-user
- Cloud sync vs local storage

What's most important for your use case? Once we nail down the requirements, I can create an MVP and architecture diagram for you."

---

❌ BAD (missing clarification):
User: "Make me a dashboard"
Assistant: [Creates generic dashboard]

✅ GOOD (asking first):
User: "Make me a dashboard"
Assistant: "I'd be happy to create a dashboard! To make it perfect for your needs:
- What data will it display? (analytics, metrics, sales, etc.)
- Who's the audience? (executives, developers, customers)
- Any specific charts or visualizations needed?
- Preferred style? (modern/minimalist, data-heavy, mobile-first)

Let me know and I'll generate a custom dashboard MVP!"

---

✅ CORRECT (explicit request):
User: "Create an MVP for a whiteboard app with touch support and multiple pen colors"
Assistant: [Calls create_mvp with complete implementation]
"I've created an interactive whiteboard MVP with:
- Touch and mouse drawing support
- Multiple pen colors (black, red, blue)
- Eraser functionality
- Clear canvas option
<!-- PLAN_ARTIFACT_AVAILABLE -->

The artifact is ready to preview above. Would you like me to also create an architecture diagram showing how the touch events and canvas rendering work?"

=== CRITICAL IMPLEMENTATION REQUIREMENTS ===

**TAILWIND CSS - MANDATORY:**
- ALWAYS include Tailwind CSS CDN in HTML: <script src="https://cdn.tailwindcss.com"></script>
- Use Tailwind utility classes for ALL styling (buttons, layouts, colors, spacing, etc.)
- Example: <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Click Me</button>
- DO NOT write custom CSS unless absolutely necessary for animations or complex effects
- Use Tailwind's responsive classes (sm:, md:, lg:, xl:) for mobile-first design

**JAVASCRIPT INTEGRATION - MANDATORY:**
- If you write JavaScript code in the jsCode field, the HTML MUST include a <script> tag that executes it
- The system automatically injects JS into the preview, but your HTML should be standalone-ready
- Example HTML structure:
  <!DOCTYPE html>
  <html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <!-- Your HTML content with Tailwind classes -->
    <script>
      // Your JavaScript code here
    </script>
  </body>
  </html>

**RESPONSIVE DESIGN - MANDATORY:**
- ALL generated UIs MUST work seamlessly across mobile (320px+), tablet (768px+), and desktop (1024px+) devices
- Use Tailwind's responsive breakpoints extensively: sm:, md:, lg:, xl:, 2xl:
- Mobile-first approach: Start with mobile layout, then enhance for larger screens
- Examples:
  * Text sizing: text-sm md:text-base lg:text-lg
  * Padding: p-4 md:p-6 lg:p-8
  * Grid layouts: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  * Flex direction: flex-col md:flex-row
  * Hidden elements: hidden md:block
- Test mental model: "Will this look good on an iPhone, iPad, and MacBook?"

**PROFESSIONAL AESTHETICS - MANDATORY:**
- Create PRODUCTION-QUALITY, visually stunning interfaces - NOT basic templates
- Use modern design patterns: cards with shadows, gradients, glassmorphism effects
- Color schemes: Use harmonious color palettes (not just primary colors)
  * Gradients: bg-gradient-to-r from-blue-500 to-purple-600
  * Subtle backgrounds: bg-gray-50, bg-slate-100
  * Accent colors: Use complementary colors for CTAs and highlights
- Shadows and depth: shadow-sm, shadow-md, shadow-lg, shadow-xl for visual hierarchy
- Rounded corners: rounded-lg, rounded-xl for modern feel
- Visual hierarchy: Clear distinction between headers, content, and actions

**EYE-PLEASING UI ELEMENTS - MANDATORY:**
- Smooth animations and transitions on ALL interactive elements
  * Transitions: transition-all duration-300 ease-in-out
  * Hover effects: hover:scale-105 hover:shadow-xl
  * Transform: hover:-translate-y-1
- Proper spacing for breathing room:
  * Generous padding: p-6, p-8 (not just p-2)
  * Consistent gaps: gap-4, gap-6, space-y-4
  * Section spacing: my-8, my-12
- Visual feedback for interactions:
  * Button states: hover:bg-blue-600 active:scale-95
  * Input focus: focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  * Loading states: animate-pulse, animate-spin
- Icons and imagery: Use emoji or Unicode symbols creatively when appropriate
- Typography: Use font weight variations (font-medium, font-semibold, font-bold) for hierarchy

**ACCESSIBILITY & BEST PRACTICES - MANDATORY:**
- Semantic HTML: Use proper tags (<header>, <nav>, <main>, <section>, <article>, <footer>)
- ARIA labels: Add aria-label for icon buttons and interactive elements
- Keyboard navigation: Ensure all interactive elements are keyboard accessible
- Focus states: focus:ring-2 focus:ring-offset-2 focus:outline-none
- Color contrast: Ensure text is readable (use text-gray-900 on light backgrounds, text-white on dark)
- Alt text: Add descriptive alt attributes for any images

**CREATIVE TOUCHES - HIGHLY ENCOURAGED:**
- Add delightful micro-interactions (button ripples, smooth page transitions)
- Use creative layouts: asymmetric grids, overlapping elements, floating cards
- Implement modern UI patterns: sticky headers, smooth scrolling, parallax effects
- Add personality: Custom illustrations, playful hover effects, animated backgrounds
- Polish: Consistent border radius, unified color scheme, cohesive spacing system

**QUALITY CHECKLIST - VERIFY BEFORE GENERATING:**
✓ Does this look like a modern SaaS product or professional website?
✓ Would users be impressed by the visual design?
✓ Is it fully responsive across all device sizes?
✓ Are there smooth transitions and hover effects?
✓ Is the color scheme harmonious and professional?
✓ Is there proper visual hierarchy and spacing?
✓ Are all interactive elements providing visual feedback?
✓ Is the code production-ready without placeholders?

REMEMBER: Generate UIs that look like they were designed by a professional UI/UX designer, not basic HTML templates!
`;

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
      getErrorMessage: (error) => (error as { message: string }).message,
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
