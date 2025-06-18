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
import ChatMessageLoading from "./ui/UIComponents";
import { Error } from "./ui/UIComponents";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { AIModel } from "@/lib/models";

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
}) {
  // Deduplicate messages at the React level to prevent duplicate keys
  const deduplicatedMessages = messages.reduce((acc: UIMessage[], message, index) => {
    // Check if message ID already exists in accumulated array
    const existingIndex = acc.findIndex(m => m.id === message.id);

    if (existingIndex === -1) {
      // New message - add it
      acc.push(message);
    } else {
      // Duplicate ID found - keep the one with more recent content or later in array
      const existing = acc[existingIndex];
      const current = message;

      // Prefer message with more content, or if same content, prefer later one (higher index)
      if (current.content.length > existing.content.length ||
          (current.content.length === existing.content.length && index > messages.findIndex(m => m.id === existing.id))) {
        acc[existingIndex] = current;
        console.warn('[ChatMessageDisplay] Replaced duplicate message:', {
          id: message.id,
          existingContent: existing.content.substring(0, 50),
          newContent: current.content.substring(0, 50)
        });
      } else {
        console.warn('[ChatMessageDisplay] Skipped duplicate message:', {
          id: message.id,
          content: current.content.substring(0, 50)
        });
      }
    }

    return acc;
  }, []);

  // Log if we found duplicates
  if (deduplicatedMessages.length !== messages.length) {
    console.warn(`[ChatMessageDisplay] Removed ${messages.length - deduplicatedMessages.length} duplicate messages from ${messages.length} total`);
  }

  return (
    <section className="chat-message-container flex flex-col w-full max-w-3xl space-y-12">
      {deduplicatedMessages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          threadId={threadId}
          message={message}
          isStreaming={status === "streaming" && deduplicatedMessages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          registerRef={registerRef}
          stop={stop}
          onRetryWithModel={onRetryWithModel}
        />
      ))}
      {status === "submitted" && <ChatMessageLoading />}
      {error && <Error message={error.message} />}
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
