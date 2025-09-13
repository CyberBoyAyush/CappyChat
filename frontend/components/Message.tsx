/**
 * Message Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Renders individual chat messages with support for text, reasoning, and editing modes.
 * Handles message controls, markdown rendering, and message editing functionality.
 */

import { memo, useState } from "react";
import MarkdownRenderer from "@/frontend/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import equal from "fast-deep-equal";
import ChatMessageControls from "./ChatMessageControls";
import { UseChatHelpers } from "@ai-sdk/react";
import ChatMessageEditor from "./ChatMessageEditor";
import ChatMessageReasoning from "./ChatMessageReasoning";
import WebSearchCitations, { cleanMessageContent } from "./WebSearchCitations";
import MessageAttachments from "./MessageAttachments";
import { AIModel, getModelConfig } from "@/lib/models";
import { User, Bot, Download, ChevronRight, Plus, List } from "lucide-react";
import { getModelIcon } from "@/frontend/components/ui/ModelComponents";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { Button } from "@/frontend/components/ui/button";
import { toast } from "sonner";
import { ImageGenerationLoading } from "./ui/UIComponents";

// Utility function to extract aspect ratio from message content
const extractAspectRatio = (message: UIMessage): string => {
  // Check if aspectRatio is directly available (for in-memory messages)
  if ((message as any).aspectRatio) {
    return (message as any).aspectRatio;
  }

  // Extract from content for persisted messages
  const content = message.content || "";
  const parts = (message as any).parts || [];

  // Check content first
  const contentMatch = content.match(/\[aspectRatio:([^\]]+)\]/);
  if (contentMatch) {
    return contentMatch[1];
  }

  // Check parts
  for (const part of parts) {
    if (part.text) {
      const partMatch = part.text.match(/\[aspectRatio:([^\]]+)\]/);
      if (partMatch) {
        return partMatch[1];
      }
    }
  }

  // Default fallback
  return "1:1";
};

// Collapsible Suggested Questions section
function SuggestedQuestions({
  suggestions,
  loading,
  onClick,
  onGenerate,
}: {
  suggestions?: string[];
  loading?: boolean;
  onClick?: (q: string) => void;
  onGenerate?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (
      next &&
      !loading &&
      (!suggestions || suggestions.length === 0)
    ) {
      onGenerate?.();
    }
  };

  return (
    <div className="pt-2">
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        className="group flex items-center w-full h-9 px-3 rounded-md border border-border/50 bg-card text-foreground/90 hover:bg-accent/30"
      >
        <List className="w-4 h-4 text-muted-foreground mr-2" />
        <span className="text-[13px] font-semibold tracking-wide">Suggested questions</span>
        <div className="ml-auto">
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        </div>
      </Button>

      {open && (
        <div className="mt-2 p-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in-50">
          {loading ? (
            <div className="text-sm text-muted-foreground px-2 py-3">Generating suggestions…</div>
          ) : suggestions && suggestions.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border/40">
              {suggestions.slice(0, 3).map((q, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onClick?.(q)}
                    className="group w-full flex items-center justify-between px-4 py-3 hover:bg-accent/20 text-left"
                    title="Ask this"
                  >
                    <span className="flex-1 text-sm text-foreground/90 text-left">{q}</span>
                    <span className="ml-3 inline-flex items-center justify-center w-5 h-5 rounded-full border border-border/50 text-muted-foreground group-hover:text-foreground">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground px-2 py-3">Tap again to regenerate</div>
          )}
        </div>
      )}
    </div>
  );
}


function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
  onRetryWithModel,
  onSuggestedQuestionClick,
  prevUserMessage,
  isLast,
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers["stop"];
  onRetryWithModel?: (model?: AIModel, message?: UIMessage) => void;
  onSuggestedQuestionClick?: (q: string) => void;
  prevUserMessage?: string;
  isLast?: boolean;
}) {
  // Generate suggestions on demand (when the section is opened)
  const handleGenerateSuggestions = async () => {
    try {
      if (isStreaming) return;
      if (!isLast) return;
      const userQuestion = prevUserMessage;
      const aiAnswer = message.content;
      if (!userQuestion || !aiAnswer) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? ({ ...m, suggestedQuestionsLoading: true } as any)
            : m
        )
      );

      const resp = await fetch("/api/ai-text-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSuggestions: true,
          userQuestion,
          aiAnswer,
          suggestionCount: 3,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const suggestions: string[] = Array.isArray(data.suggestions)
          ? data.suggestions.slice(0, 3)
          : [];
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? ({
                  ...m,
                  suggestedQuestions: suggestions,
                  suggestedQuestionsLoading: false,
                } as any)
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? ({ ...m, suggestedQuestionsLoading: false } as any)
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id
            ? ({ ...m, suggestedQuestionsLoading: false } as any)
            : m
        )
      );
    }
  };

  const [mode, setMode] = useState<"view" | "edit">("view");
  const { selectedModel } = useModelStore();

  // Get model config for the message's stored model (for assistant messages) or current selected model (fallback)
  const messageModel =
    message.role === "assistant" ? (message as any).model : undefined;
  const modelToUse = messageModel || selectedModel;

  // Ensure we have a valid model name
  const validModelToUse =
    modelToUse && typeof modelToUse === "string"
      ? (modelToUse as AIModel)
      : selectedModel;
  const modelConfig = getModelConfig(validModelToUse);
  const modelIcon = getModelIcon(modelConfig.iconType, 16, "text-primary");

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col w-full gap-2",
        message.role === "user" ? "items-end py-1" : "items-start py-1 pb-6"
      )}
    >
      {(
        message.parts || [
          { type: "text", text: cleanMessageContent(message.content || "") },
        ]
      ).map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === "reasoning") {
          return (
            <ChatMessageReasoning
              key={key}
              reasoning={(part as any).reasoning || ""}
              id={message.id}
            />
          );
        }

        if (type === "text") {
          return message.role === "user" ? (
            <div
              key={key}
              className="flex gap-2 max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[55%] pl-4"
              ref={(el) => registerRef?.(message.id, el)}
            >
              {/* User Avatar */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>

              {/* User Message Content */}
              <div className="relative group flex-1 min-w-0 overflow-hidden">
                <div className="px-3 py-2 mb-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm hover:border-border/70 transition-all duration-200">
                  {mode === "edit" && (
                    <ChatMessageEditor
                      threadId={threadId}
                      message={message}
                      content={(part as any).text || ""}
                      setMessages={setMessages}
                      reload={reload}
                      setMode={setMode}
                      stop={stop}
                    />
                  )}
                  {mode === "view" && (
                    <>
                      <p className="break-words whitespace-pre-wrap text-sm leading-relaxed overflow-wrap-anywhere">
                        {cleanMessageContent((part as any).text || "")}
                      </p>
                      {/* Show attachments for user messages */}
                      {(message as any).attachments &&
                        (message as any).attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <MessageAttachments
                              attachments={(message as any).attachments}
                            />
                          </div>
                        )}
                    </>
                  )}
                </div>
                {mode === "view" && (
                  <div className="mt-1">
                    <ChatMessageControls
                      threadId={threadId}
                      content={(part as any).text || ""}
                      message={message}
                      setMode={setMode}
                      setMessages={setMessages}
                      reload={reload}
                      stop={stop}
                      onRetryWithModel={onRetryWithModel}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              key={key}
              className="flex gap-2 w-full max-w-full pr-4"
              ref={(el) => registerRef?.(message.id, el)}
            >
              {/* Assistant Avatar with Model Icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {modelIcon || <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
              </div>

              {/* Assistant Message Content */}
              <div className="group flex-1 flex flex-col gap-3 min-w-0 overflow-hidden max-w-full chat-message-container no-scrollbar">
                {/* Check if this is an image generation loading message */}
                {(() => {
                  const messageText = cleanMessageContent(
                    (part as any).text || ""
                  );
                  const isImageGenerationLoading =
                    (message as any).isImageGenerationLoading ||
                    messageText.includes("🎨 Generating your image") ||
                    messageText.includes("Generating your image");

                  console.log("🔍 Message text:", messageText);
                  console.log(
                    "🔍 Is image generation loading:",
                    isImageGenerationLoading
                  );
                  console.log(
                    "🔍 Has loading flag:",
                    (message as any).isImageGenerationLoading
                  );

                  // Only show loading component if this is actually a loading message AND no image is present yet
                  if (isImageGenerationLoading && !(message as any).imgurl) {
                    console.log(
                      "🎨 Rendering ImageGenerationLoading component"
                    );
                    const aspectRatio = extractAspectRatio(message);
                    console.log("🎯 Extracted aspect ratio:", aspectRatio);
                    return (
                      <div className="mb-4">
                        <ImageGenerationLoading aspectRatio={aspectRatio} />
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Show generated image if present */}
                {(message as any).imgurl && (
                  <div className="mb-3">
                    {(() => {
                      const aspectRatio = extractAspectRatio(message);
                      console.log(
                        "🎯 Extracted aspect ratio for image display:",
                        aspectRatio
                      );
                      const aspectRatioClasses = {
                        "1:1": "aspect-square max-w-md",
                        "21:9": "aspect-[21/9] max-w-2xl",
                        "16:9": "aspect-video max-w-2xl",
                        "4:3": "aspect-[4/3] max-w-lg",
                      };
                      const aspectClass =
                        aspectRatioClasses[
                          aspectRatio as keyof typeof aspectRatioClasses
                        ] || "aspect-square max-w-md";

                      return (
                        <div
                          className={cn(
                            "relative w-full rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-border/70 transition-all duration-200 group",
                            aspectClass
                          )}
                        >
                          <img
                            src={(message as any).imgurl}
                            alt="Generated image"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error(
                                "Failed to load generated image:",
                                (message as any).imgurl
                              );
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md px-2 py-1">
                            <span className="text-xs text-white font-medium">
                              AI Generated
                            </span>
                          </div>
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-none"
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    (message as any).imgurl
                                  );
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `generated-image-${message.id}.png`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                  toast.success(
                                    "Image downloaded successfully!"
                                  );
                                } catch (error) {
                                  console.error(
                                    "Failed to download image:",
                                    error
                                  );
                                  toast.error("Failed to download image");
                                }
                              }}
                              title="Download image"
                            >
                              <Download className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Only show regular markdown content if not an image generation message */}
                {(() => {
                  const messageText = cleanMessageContent(
                    (part as any).text || ""
                  );
                  const isImageGenerationLoading =
                    (message as any).isImageGenerationLoading ||
                    messageText.includes("🎨 Generating your image") ||
                    messageText.includes("Generating your image");
                  const isImageGeneration = (message as any).isImageGeneration;

                  console.log(
                    "🔍 Checking markdown render - isImageGenerationLoading:",
                    isImageGenerationLoading
                  );
                  console.log(
                    "🔍 Is image generation result:",
                    isImageGeneration
                  );
                  console.log("🔍 Has imgurl:", !!(message as any).imgurl);

                  // Show markdown content if:
                  // 1. It's not a loading message AND not an image generation result, OR
                  // 2. It's an image generation result but has actual text content to show
                  if (
                    !isImageGenerationLoading &&
                    !isImageGeneration &&
                    messageText.trim()
                  ) {
                    // Filter out aspect ratio metadata from display
                    // Clean the text by removing aspect ratio markers and search URLs markers
                    let cleanedText = messageText
                      .replace(/\[aspectRatio:[^\]]+\]/g, "")
                      .trim();
                    cleanedText = cleanMessageContent(cleanedText);

                    if (cleanedText) {
                      return (
                        <div className="break-words overflow-hidden max-w-full mb-3 no-scrollbar">
                          <MarkdownRenderer
                            content={cleanedText}
                            id={message.id}
                          />
                        </div>
                      );
                    }
                  }

                  return null;
                })()}

                {/* Show web search citations for assistant messages with search results */}
                {(() => {
                  const hasWebSearchResults =
                    message.role === "assistant" &&
                    (message as any).webSearchResults &&
                    Array.isArray((message as any).webSearchResults) &&
                    (message as any).webSearchResults.length > 0;

                  console.log("🔗 Message component checking for citations:", {
                    messageId: message.id,
                    role: message.role,
                    hasWebSearchResults,
                    webSearchResults: (message as any).webSearchResults,
                    isStreaming,
                  });

                  return (
                    hasWebSearchResults && (
                      <div className="flex-shrink-0">
                        <WebSearchCitations
                          results={(message as any).webSearchResults}
                          searchQuery="web search"
                          isStreaming={isStreaming}
                        />
                      </div>
                    )
                  );
                })()}

                {/* Suggested Questions */}
                {!isStreaming && isLast && message.role === "assistant" && (
                  <SuggestedQuestions
                    suggestions={(message as any).suggestedQuestions}
                    loading={(message as any).suggestedQuestionsLoading}
                    onClick={(q) => onSuggestedQuestionClick?.(q)}
                    onGenerate={handleGenerateSuggestions}
                  />
                )}

                {/* Controls - placed after citations and suggestions */}
                {!isStreaming && (
                  <div className="flex-shrink-0 mt-1">
                    <ChatMessageControls
                      threadId={threadId}
                      content={(part as any).text || ""}
                      message={message}
                      setMessages={setMessages}
                      reload={reload}
                      stop={stop}
                      onRetryWithModel={onRetryWithModel}
                    />
                  </div>
                )}

              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

const PreviewMessage = memo(PureMessage, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  // Check if model field changed (important for assistant messages)

  if ((prevProps.message as any).model !== (nextProps.message as any).model)
    return false;
  // Check if imgurl field changed (important for image generation messages)
  if ((prevProps.message as any).imgurl !== (nextProps.message as any).imgurl)
    return false;
  // Check if image generation loading flag changed
  if (
    (prevProps.message as any).isImageGenerationLoading !==
    (nextProps.message as any).isImageGenerationLoading
  )
    return false;
  // Check if image generation result flag changed
  if (
    (prevProps.message as any).isImageGeneration !==
    (nextProps.message as any).isImageGeneration
  )
    return false;
  // Check if suggested questions loading changed
  if (
    (prevProps.message as any).suggestedQuestionsLoading !==
    (nextProps.message as any).suggestedQuestionsLoading
  )
    return false;
  // Check if suggested questions array changed
  const prevSug = ((prevProps.message as any).suggestedQuestions || []) as any[];
  const nextSug = ((nextProps.message as any).suggestedQuestions || []) as any[];
  if (!equal(prevSug, nextSug)) return false;
  return true;
});

PreviewMessage.displayName = "PreviewMessage";

export default PreviewMessage;
