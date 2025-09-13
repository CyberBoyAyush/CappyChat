/**
 * ChatMessageDisplay Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main container for displaying all messages in a chat thread.
 * Handles message rendering, loading states, and error display.
 */

import { memo } from "react";
import PreviewMessage from "./Message";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { MessageLoading, SmartError } from "./ui/UIComponents";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { AIModel } from "@/lib/models";
import WebSearchLoader from "./WebSearchLoader";
import RedditSearchLoader from "./RedditSearchLoader";
import {
  useSearchTypeStore,
  SearchType,
} from "@/frontend/stores/SearchTypeStore";
import { devWarn } from "@/lib/logger";

function PureMessageDisplay({
  threadId,
  messages,
  status,
  setMessages,
  reload,
  error,
  stop,
  registerRef,
  onRetryWithModel,
  isWebSearching,
  webSearchQuery,
  selectedSearchType,
  onSuggestedQuestionClick,
  streamingWebImgs,
}: {
  threadId: string;
  messages: UIMessage[];
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  status: UseChatHelpers["status"];
  error: UseChatHelpers["error"];
  stop: UseChatHelpers["stop"];
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
  onRetryWithModel?: (model?: AIModel, message?: UIMessage) => void;
  isWebSearching?: boolean;
  webSearchQuery?: string;
  selectedSearchType?: SearchType;
  onSuggestedQuestionClick?: (q: string) => void;
  streamingWebImgs?: string[];
}) {
  const { selectedSearchType: storeSearchType } = useSearchTypeStore();
  // Use the passed selectedSearchType prop if available, otherwise fall back to store
  const currentSearchType = selectedSearchType || storeSearchType;
  // Deduplicate messages at the React level to prevent duplicate keys
  const deduplicatedMessages = messages.reduce(
    (acc: UIMessage[], message, index) => {
      // Check if message ID already exists in accumulated array
      const existingIndex = acc.findIndex((m) => m.id === message.id);

      if (existingIndex === -1) {
        // New message - add it
        acc.push(message);
      } else {
        // Duplicate ID found - keep the one with more recent content or later in array
        const existing = acc[existingIndex];
        const current = message;

        // Prefer message with more content, or if same content, prefer later one (higher index)
        if (
          current.content.length > existing.content.length ||
          (current.content.length === existing.content.length &&
            index > messages.findIndex((m) => m.id === existing.id))
        ) {
          acc[existingIndex] = current;
          devWarn("[ChatMessageDisplay] Replaced duplicate message:", {
            id: message.id,
            existingContent: existing.content.substring(0, 50),
            newContent: current.content.substring(0, 50),
          });
        } else {
          devWarn("[ChatMessageDisplay] Skipped duplicate message:", {
            id: message.id,
            content: current.content.substring(0, 50),
          });
        }
      }

      return acc;
    },
    []
  );

  // Log if we found duplicates
  if (deduplicatedMessages.length !== messages.length) {
    devWarn(
      `[ChatMessageDisplay] Removed ${
        messages.length - deduplicatedMessages.length
      } duplicate messages from ${messages.length} total`
    );
  }

  return (
    <section className="chat-message-container flex flex-col w-full max-w-3xl space-y-6">
      {deduplicatedMessages.map((message, index) => {
        const isLast = deduplicatedMessages.length - 1 === index;
        const prevUserMessage = (() => {
          for (let i = index - 1; i >= 0; i--) {
            if (deduplicatedMessages[i].role === "user") {
              return deduplicatedMessages[i].content;
            }
          }
          return undefined;
        })();
        return (
          <PreviewMessage
            key={message.id}
            threadId={threadId}
            message={message}
            isStreaming={status === "streaming" && isLast}
            setMessages={setMessages}
            reload={reload}
            registerRef={registerRef}
            stop={stop}
            onRetryWithModel={onRetryWithModel}
            onSuggestedQuestionClick={onSuggestedQuestionClick}
            prevUserMessage={prevUserMessage}
            isLast={isLast}
            streamingWebImgs={isLast ? streamingWebImgs : undefined}
          />
        );
      })}
      {status === "submitted" && (
        <div className="flex gap-2 w-full max-w-full pr-4 pb-6">
          {/* Assistant Avatar */}
          <div className="flex-shrink-0 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-primary/70 animate-pulse" />
            </div>
          </div>
          {/* Loading Animation - Show appropriate search loader if search is enabled */}
          <div className="flex-1 mt-1">
            {isWebSearching || currentSearchType !== "chat" ? (
              currentSearchType === "reddit" ? (
                <RedditSearchLoader
                  searchQuery={webSearchQuery || "search query"}
                />
              ) : currentSearchType === "web" ? (
                <WebSearchLoader
                  searchQuery={webSearchQuery || "search query"}
                />
              ) : (
                <MessageLoading />
              )
            ) : (
              <MessageLoading />
            )}
          </div>
        </div>
      )}
      {error && <SmartError message={error.message} />}
    </section>
  );
}

const MessageDisplay = memo(PureMessageDisplay, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.error !== nextProps.error) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  return true;
});

MessageDisplay.displayName = "MessageDisplay";

export default MessageDisplay;
