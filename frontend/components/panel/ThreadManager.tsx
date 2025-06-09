/**
 * ThreadManager Hook
 *
 * Used in: frontend/components/panel/ConversationPanel.tsx
 * Purpose: Custom hook that manages thread operations including navigation, deletion, and active state.
 * Provides thread data and operations for the conversation panel.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router';
import { deleteThread, getThreads } from '@/frontend/database/chatQueries';

// Custom hook for managing thread operations
export const useThreadManager = () => {
  const { id: currentThreadId } = useParams();
  const router = useNavigate();
  const threadCollection = useLiveQuery(() => getThreads(), []);

  const navigateToThread = (threadId: string) => {
    if (currentThreadId === threadId) {
      return;
    }
    router(`/chat/${threadId}`);
  };

  const removeThread = async (threadId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await deleteThread(threadId);
    router(`/chat`);
  };

  const isActiveThread = (threadId: string) => currentThreadId === threadId;

  return {
    currentThreadId,
    threadCollection,
    navigateToThread,
    removeThread,
    isActiveThread,
  };
};

// Thread data interface
export interface ThreadData {
  id: string;
  title: string;
}

// Thread operations interface
export interface ThreadOperations {
  onNavigate: (threadId: string) => void;
  onDelete: (threadId: string, event: React.MouseEvent) => void;
  isActive: boolean;
}
