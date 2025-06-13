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
import { useOptimizedMessages } from '@/frontend/hooks/useOptimizedHybridDB';
import { UIMessage } from 'ai';

export default function ChatThreadPage() {
  const { id } = useParams();
  if (!id) throw new Error('Thread ID is required');

  // Use optimized hook for better performance
  const { messages, isLoading } = useOptimizedMessages(id);

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
