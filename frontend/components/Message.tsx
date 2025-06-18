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
import WebSearchCitations from "./WebSearchCitations";
import MessageAttachments from "./MessageAttachments";
import { AIModel, getModelConfig } from "@/lib/models";
import { User, Bot } from "lucide-react";
import { getModelIcon } from "@/frontend/components/ui/ModelComponents";
import { useModelStore } from "@/frontend/stores/ChatModelStore";

function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
  onRetryWithModel,
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers["stop"];
  onRetryWithModel?: (model?: AIModel, message?: UIMessage) => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const { selectedModel } = useModelStore();

  // Get model config for the message's stored model (for assistant messages) or current selected model (fallback)
  const messageModel = message.role === "assistant" ? (message as any).model : undefined;
  const modelToUse = messageModel || selectedModel;

  // Ensure we have a valid model name
  const validModelToUse = modelToUse && typeof modelToUse === 'string' ? modelToUse as AIModel : selectedModel;
  const modelConfig = getModelConfig(validModelToUse);
  const modelIcon = getModelIcon(modelConfig.iconType, 16, "text-primary");

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col w-full gap-2 py-1",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      {(message.parts || [{ type: "text", text: message.content || "" }]).map((part, index) => {
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
                <div className="px-3 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm hover:border-border/70 transition-all duration-200">
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
                      <p className="break-words whitespace-pre-wrap text-sm leading-relaxed overflow-wrap-anywhere">{(part as any).text || ""}</p>
                      {/* Show attachments for user messages */}
                      {(message as any).attachments && (message as any).attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <MessageAttachments attachments={(message as any).attachments} />
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
            >
              {/* Assistant Avatar with Model Icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {modelIcon || <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
              </div>

              {/* Assistant Message Content */}
              <div className="group flex-1 flex flex-col gap-2 min-w-0 overflow-hidden max-w-full">
                <div className="break-words overflow-hidden max-w-full">
                  <MarkdownRenderer content={(part as any).text || ""} id={message.id} />
                </div>

                {!isStreaming && (
                  <div className="flex-shrink-0">
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

                {/* Show web search citations for assistant messages with search results */}
                {(() => {
                  const hasWebSearchResults = message.role === "assistant" &&
                    (message as any).webSearchResults &&
                    Array.isArray((message as any).webSearchResults) &&
                    (message as any).webSearchResults.length > 0;

                  console.log("🔗 Message component checking for citations:", {
                    messageId: message.id,
                    role: message.role,
                    hasWebSearchResults,
                    webSearchResults: (message as any).webSearchResults,
                    isStreaming
                  });

                  return hasWebSearchResults && (
                    <div className="flex-shrink-0">
                      <WebSearchCitations
                        results={(message as any).webSearchResults}
                        searchQuery="web search"
                        isStreaming={isStreaming}
                      />
                    </div>
                  );
                })()}
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
  if ((prevProps.message as any).model !== (nextProps.message as any).model) return false;
  return true;
});

PreviewMessage.displayName = "PreviewMessage";

export default PreviewMessage;
