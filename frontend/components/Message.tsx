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

function PureMessage({
  threadId,
  message,
  setMessages,
  reload,
  isStreaming,
  registerRef,
  stop,
}: {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isStreaming: boolean;
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  stop: UseChatHelpers["stop"];
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <div
      role="article"
      className={cn(
        "flex flex-col w-full",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      {message.parts.map((part, index) => {
        const { type } = part;
        const key = `message-${message.id}-part-${index}`;

        if (type === "reasoning") {
          return (
            <ChatMessageReasoning
              key={key}
              reasoning={part.reasoning}
              id={message.id}
            />
          );
        }

        if (type === "text") {
          return message.role === "user" ? (
            <div
              key={key}
              className="relative group px-2 py-1.5 rounded-xl bg-card border border-border shadow-sm max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%]"
              ref={(el) => registerRef(message.id, el)}
            >
              {mode === "edit" && (
                <ChatMessageEditor
                  threadId={threadId}
                  message={message}
                  content={part.text}
                  setMessages={setMessages}
                  reload={reload}
                  setMode={setMode}
                  stop={stop}
                />
              )}
              {mode === "view" && (
                <p className="break-words whitespace-pre-wrap">{part.text}</p>
              )}
              {mode === "view" && (
                <ChatMessageControls
                  threadId={threadId}
                  content={part.text}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                  stop={stop}
                />
              )}
            </div>
          ) : (
            <div
              key={key}
              className="group flex flex-col gap-2 w-full max-w-3xl"
            >
              <MarkdownRenderer content={part.text} id={message.id} />
              {!isStreaming && (
                <ChatMessageControls
                  threadId={threadId}
                  content={part.text}
                  message={message}
                  setMessages={setMessages}
                  reload={reload}
                  stop={stop}
                />
              )}
              {/* Show web search citations for assistant messages with search results */}
              {message.role === "assistant" &&
                (message as any).webSearchResults && (
                  <>
                    {console.log(
                      "🎯 Rendering citations for message:",
                      message.id,
                      "Results:",
                      (message as any).webSearchResults
                    )}
                    <WebSearchCitations
                      results={(message as any).webSearchResults}
                      searchQuery="web search"
                    />
                  </>
                )}
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
  return true;
});

PreviewMessage.displayName = "PreviewMessage";

export default PreviewMessage;
