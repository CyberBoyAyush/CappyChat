/**
 * Message Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Renders individual chat messages with support for text, reasoning, and editing modes.
 * Handles message controls, markdown rendering, and message editing functionality.
 */

import { memo, useState, useEffect, useRef, useCallback } from "react";
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
import {
  User,
  Bot,
  Download,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  List,
} from "lucide-react";
import { getModelIcon } from "@/frontend/components/ui/ModelComponents";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { Button } from "@/frontend/components/ui/button";
import { toast } from "@/frontend/components/ui/Toast";
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
    if (next && !loading && (!suggestions || suggestions.length === 0)) {
      onGenerate?.();
    }
  };

  return (
    <div className="">
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        className="group flex items-center w-full h-12 px-3 rounded-lg border border-border/50 bg-card/60 text-foreground/90 hover:bg-accent/30"
      >
        <List className="w-4 h-4 text-muted-foreground mr-2" />
        <span className="text-base font-semibold tracking-wide">
          Suggested questions
        </span>
        <div className="ml-auto">
          <ChevronRight
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        </div>
      </Button>

      {open && (
        <div className="mt-2 p-2 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in-50">
          {loading ? (
            <div className="text-sm text-muted-foreground px-2 py-3">
              Generating suggestions…
            </div>
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
                    <span className="flex-1 text-sm text-foreground/90 text-left">
                      {q}
                    </span>
                    <span className="ml-3 inline-flex items-center justify-center w-5 h-5 rounded-full border border-border/50 text-muted-foreground group-hover:text-foreground">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground px-2 py-3">
              Tap again to regenerate
            </div>
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
  streamingWebImgs,
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
  streamingWebImgs?: string[];
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

  // Image preview state for web search images
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(4);

  // Mobile swipe state for image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewTouchStartX = useRef<number>(0);
  const previewTouchStartY = useRef<number>(0);

  // Touch handling for mobile swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, imgs: string[]) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - go to previous image
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1));
      } else {
        // Swipe left - go to next image
        setCurrentImageIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0));
      }
    }
  }, []);

  // Touch handling for preview overlay
  const handlePreviewTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    previewTouchStartX.current = touch.clientX;
    previewTouchStartY.current = touch.clientY;
  }, []);

  const handlePreviewTouchEnd = useCallback(
    (e: React.TouchEvent, goPrev: () => void, goNext: () => void) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - previewTouchStartX.current;
      const deltaY = touch.clientY - previewTouchStartY.current;

      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        e.stopPropagation();
        if (deltaX > 0) {
          // Swipe right - go to previous image
          goPrev();
        } else {
          // Swipe left - go to next image
          goNext();
        }
      }
    },
    []
  );

  // Reset current image index when images change
  useEffect(() => {
    const imgs =
      ((message as any).webSearchImgs as string[] | undefined) ||
      (isStreaming ? (streamingWebImgs as string[] | undefined) : undefined) ||
      [];
    if (imgs.length > 0 && currentImageIndex >= imgs.length) {
      setCurrentImageIndex(0);
    }
  }, [(message as any).webSearchImgs, streamingWebImgs, isStreaming]);

  // Keyboard navigation for preview
  useEffect(() => {
    if (previewIdx === null) return;
    const overlayImgs =
      ((message as any).webSearchImgs as string[] | undefined) ||
      (isStreaming ? (streamingWebImgs as string[] | undefined) : undefined) ||
      [];
    const total = overlayImgs.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewIdx(null);
      if (e.key === "ArrowLeft" && total > 1)
        setPreviewIdx((i) => (i! <= 0 ? total - 1 : i! - 1));
      if (e.key === "ArrowRight" && total > 1)
        setPreviewIdx((i) => (i! >= total - 1 ? 0 : i! + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIdx, isStreaming]);

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col w-full gap-2 text-foreground",
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
              className="flex gap-2 max-w-[95%] sm:max-w-[85%] md:max-w-[75%]  pl-4"
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
                      <p className="break-words whitespace-pre-wrap text-sm leading-relaxed overflow-wrap-anywhere text-foreground">
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

                {/* Web search images (always visible) — now shown above message text */}
                {(() => {
                  const fromDb = (message as any).webSearchImgs as
                    | string[]
                    | undefined;
                  const fromStream = isStreaming
                    ? (streamingWebImgs as string[] | undefined) || undefined
                    : undefined;
                  const imgs =
                    (fromDb && fromDb.length > 0 ? fromDb : fromStream) || [];
                  const showImages =
                    message.role === "assistant" && imgs.length > 0;
                  if (!showImages) return null;

                  const showCount = Math.min(visibleCount, imgs.length);
                  const remaining = Math.max(imgs.length - showCount, 0);

                  return (
                    <div className="mb-3">
                      <div className="text-sm text-muted-foreground mb-2 flex items-center justify-between">
                        <span>Images from the web ({imgs.length})</span>
                        {/* Mobile navigation indicators */}
                        <div className="flex md:hidden items-center gap-1">
                          {imgs.length > 1 && (
                            <>
                              <span className="text-xs">
                                {currentImageIndex + 1} / {imgs.length}
                              </span>
                              <div className="flex gap-1 ml-2">
                                {imgs
                                  .slice(0, Math.min(5, imgs.length))
                                  .map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-colors",
                                        i ===
                                          currentImageIndex %
                                            Math.min(5, imgs.length)
                                          ? "bg-primary"
                                          : "bg-muted-foreground/30"
                                      )}
                                    />
                                  ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Desktop grid layout */}
                      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {imgs.slice(0, showCount).map((src, i) => {
                          const isLastVisible =
                            i === showCount - 1 && remaining > 0;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewIdx(i)}
                              className="relative block focus:outline-none"
                              title="Preview image"
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-36 sm:h-44 md:h-48 w-full object-cover rounded border hover:opacity-90 transition"
                                loading="lazy"
                              />
                              {isLastVisible && (
                                <div
                                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded"
                                  aria-hidden="true"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setVisibleCount(Math.min(imgs.length, 15));
                                  }}
                                >
                                  <span className="text-base sm:text-lg font-medium">
                                    +{remaining} more
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Mobile horizontal scroll layout */}
                      <div
                        className="md:hidden relative"
                        ref={containerRef}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={(e) => handleTouchEnd(e, imgs)}
                      >
                        <div className="overflow-hidden rounded-lg">
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                              transform: `translateX(-${
                                currentImageIndex * 100
                              }%)`,
                              width: `${imgs.length * 100}%`,
                            }}
                          >
                            {imgs.map((src, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewIdx(i)}
                                className="relative block focus:outline-none flex-shrink-0"
                                style={{ width: `${100 / imgs.length}%` }}
                                title="Preview image"
                              >
                                <img
                                  src={src}
                                  alt=""
                                  className="h-48 w-full object-cover border"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mobile navigation buttons */}
                        {imgs.length > 1 && (
                          <>
                            <button
                              type="button"
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              onClick={() =>
                                setCurrentImageIndex((prev) =>
                                  prev > 0 ? prev - 1 : imgs.length - 1
                                )
                              }
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                              onClick={() =>
                                setCurrentImageIndex((prev) =>
                                  prev < imgs.length - 1 ? prev + 1 : 0
                                )
                              }
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {remaining > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <button
                            type="button"
                            className="px-3 py-1 rounded border hover:bg-accent"
                            onClick={() =>
                              setVisibleCount(Math.min(imgs.length, 15))
                            }
                          >
                            Show more
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border hover:bg-accent"
                            onClick={() =>
                              setVisibleCount((c) =>
                                Math.min(c + 1, Math.min(imgs.length, 15))
                              )
                            }
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border hover:bg-accent"
                            onClick={() =>
                              setVisibleCount((c) =>
                                Math.min(c + 2, Math.min(imgs.length, 15))
                              )
                            }
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 rounded border hover:bg-accent"
                            onClick={() =>
                              setVisibleCount((c) =>
                                Math.min(c + 5, Math.min(imgs.length, 15))
                              )
                            }
                          >
                            +5
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                    <>
                      {/* In-app image preview overlay with navigation & close */}
                      {previewIdx !== null &&
                        (() => {
                          const overlayImgs =
                            ((message as any).webSearchImgs as
                              | string[]
                              | undefined) ||
                            (isStreaming
                              ? (streamingWebImgs as string[] | undefined)
                              : undefined) ||
                            [];
                          const total = overlayImgs.length;
                          if (total === 0) return null;
                          const idx = Math.min(
                            Math.max(previewIdx as number, 0),
                            total - 1
                          );
                          const src = overlayImgs[idx];
                          const host = (() => {
                            try {
                              return new URL(src).hostname.replace(
                                /^www\./,
                                ""
                              );
                            } catch {
                              return "";
                            }
                          })();
                          const goPrev = (e?: any) => {
                            e?.stopPropagation?.();
                            setPreviewIdx((i) =>
                              i! <= 0 ? total - 1 : i! - 1
                            );
                          };
                          const goNext = (e?: any) => {
                            e?.stopPropagation?.();
                            setPreviewIdx((i) =>
                              i! >= total - 1 ? 0 : i! + 1
                            );
                          };
                          return (
                            <div
                              className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                              onClick={() => setPreviewIdx(null)}
                              onTouchStart={handlePreviewTouchStart}
                              onTouchEnd={(e) =>
                                handlePreviewTouchEnd(e, goPrev, goNext)
                              }
                              role="dialog"
                              aria-modal="true"
                            >
                              <div className="absolute top-4 left-4 text-xs px-2 py-1 rounded bg-white/10 text-white">
                                {idx + 1} of {total}
                              </div>
                              <button
                                type="button"
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewIdx(null);
                                }}
                                aria-label="Close"
                              >
                                <X className="h-5 w-5" />
                              </button>
                              {total > 1 && (
                                <button
                                  type="button"
                                  className="absolute left-6 md:left-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                                  onClick={goPrev}
                                  aria-label="Previous"
                                >
                                  <ChevronLeft className="h-6 w-6" />
                                </button>
                              )}
                              <img
                                src={src}
                                alt=""
                                className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {total > 1 && (
                                <button
                                  type="button"
                                  className="absolute right-6 md:right-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                                  onClick={goNext}
                                  aria-label="Next"
                                >
                                  <ChevronRight className="h-6 w-6" />
                                </button>
                              )}
                              {host && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-3xl">
                                  <div className="mx-auto text-center text-xs md:text-sm text-white/90 bg-black/40 rounded px-3 py-2">
                                    {host}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {hasWebSearchResults && (
                        <div className="flex-shrink-0">
                          <WebSearchCitations
                            results={(message as any).webSearchResults}
                            searchQuery="web search"
                            isStreaming={isStreaming}
                          />
                        </div>
                      )}
                    </>
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
  // Re-render if streaming images change while streaming
  if (!equal(prevProps.streamingWebImgs, nextProps.streamingWebImgs))
    return false;
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
  const prevSug = ((prevProps.message as any).suggestedQuestions ||
    []) as any[];
  const nextSug = ((nextProps.message as any).suggestedQuestions ||
    []) as any[];
  if (!equal(prevSug, nextSug)) return false;
  return true;
});

PreviewMessage.displayName = "PreviewMessage";

export default PreviewMessage;
