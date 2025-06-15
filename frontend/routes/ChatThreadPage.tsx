/**
 * ChatThreadPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/chat/:id" route)
 * Purpose: Displays an existing chat thread with its message history.
 * Loads messages from database and renders the chat interface for the specific thread.
 */

import { useCallback } from 'react';
import ChatInterface from '@/frontend/components/ChatInterface';
import { useParams } from 'react-router';
import { useOptimizedMessages } from '@/frontend/hooks/useOptimizedHybridDB';
import { UIMessage } from 'ai';

export default function ChatThreadPage() {
  const { id } = useParams();
  if (!id) throw new Error('Thread ID is required');

  // Use optimized hook for better performance
  const { messages, isLoading } = useOptimizedMessages(id);

  const convertToUIMessages = useCallback((messages?: any[]) => {
    console.log('🔄 Converting messages to UI format:', messages?.length, 'messages');
    return messages?.map((message) => {
      if (message.attachments && message.attachments.length > 0) {
        console.log('📎 Message with attachments found:', message.id, 'Attachments:', message.attachments);
      }
      return {
        id: message.id,
        role: message.role,
        parts: message.parts as UIMessage['parts'],
        content: message.content || '',
        createdAt: message.createdAt,
        webSearchResults: message.webSearchResults,
        attachments: message.attachments, // ✅ Include attachments!
      };
    });
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
