/**
 * ChatThreadPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/chat/:id" route)
 * Purpose: Displays an existing chat thread with its message history.
 * Loads messages from database and renders the chat interface for the specific thread.
 */

import { useState, useEffect, useCallback } from 'react';
import ChatInterface from '@/frontend/components/ChatInterface';
import { useParams } from 'react-router';
import { HybridDB, dbEvents } from '@/lib/hybridDB';
import { UIMessage } from 'ai';

export default function ChatThreadPage() {
  const { id } = useParams();
  if (!id) throw new Error('Thread ID is required');

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle message updates from the hybrid database
  const handleMessagesUpdated = useCallback((threadId: string, updatedMessages: any[]) => {
    if (threadId === id) {
      setMessages(updatedMessages);
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        // Load messages from remote for better cross-device sync
        const threadMessages = await HybridDB.loadMessagesFromRemote(id);
        if (isMounted) {
          setMessages(threadMessages || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to local messages if remote fails
        const localMessages = HybridDB.getMessagesByThreadId(id);
        if (isMounted) {
          setMessages(localMessages || []);
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    // Listen for real-time message updates
    dbEvents.on('messages_updated', handleMessagesUpdated);

    return () => {
      isMounted = false;
      dbEvents.off('messages_updated', handleMessagesUpdated);
    };
  }, [id, handleMessagesUpdated]);

  const convertToUIMessages = useCallback((messages?: any[]) => {
    return messages?.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts as UIMessage['parts'],
      content: message.content || '',
      createdAt: message.createdAt,
    }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ChatInterface
      key={id}
      threadId={id}
      initialMessages={convertToUIMessages(messages) || []}
    />
  );
}
