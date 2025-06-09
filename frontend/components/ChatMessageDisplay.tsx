/**
 * ChatMessageDisplay Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Main container for displaying all messages in a chat thread.
 * Handles message rendering, loading states, and error display.
 */

import { memo } from 'react';
import PreviewMessage from './Message';
import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import equal from 'fast-deep-equal';
import ChatMessageLoading from './ui/ChatMessageLoading';
import Error from './Error';

function PureMessageDisplay({
  threadId,
  messages,
  status,
  setMessages,
  reload,
  error,
  stop,
  registerRef,
}: {
  threadId: string;
  messages: UIMessage[];
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  status: UseChatHelpers['status'];
  error: UseChatHelpers['error'];
  stop: UseChatHelpers['stop'];
  registerRef: (id: string, ref: HTMLDivElement | null) => void;
}) {
  return (
    <section className="flex flex-col space-y-12">
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          threadId={threadId}
          message={message}
          isStreaming={status === 'streaming' && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          registerRef={registerRef}
          stop={stop}
        />
      ))}
      {status === 'submitted' && <ChatMessageLoading />}
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

MessageDisplay.displayName = 'MessageDisplay';

export default MessageDisplay;
