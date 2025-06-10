/**
 * ChatThreadPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/chat/:id" route)
 * Purpose: Displays an existing chat thread with its message history.
 * Loads messages from database and renders the chat interface for the specific thread.
 */

import ChatInterface from '@/frontend/components/ChatInterface';
import { useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getMessagesByThreadId } from '../database/chatQueries';
import { type DBMessage } from '../database/chatDatabase';
import { UIMessage } from 'ai';

export default function ChatThreadPage() {
  const { id } = useParams();
  if (!id) throw new Error('Thread ID is required');

  const messages = useLiveQuery(() => getMessagesByThreadId(id), [id]);

  const convertToUIMessages = (messages?: DBMessage[]) => {
    return messages?.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts as UIMessage['parts'],
      content: message.content || '',
      createdAt: message.createdAt,
    }));
  };

  return (
    <ChatInterface
      key={id}
      threadId={id}
      initialMessages={convertToUIMessages(messages) || []}
    />
  );
}
