/**
 * ThreadManager Hook
 *
 * Used in: frontend/components/panel/ConversationPanel.tsx
 * Purpose: Custom hook that manages thread operations including navigation, deletion, and active state.
 * Provides thread data and operations for the conversation panel.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Thread } from '@/lib/appwriteDB';
import { HybridDB, dbEvents } from '@/lib/hybridDB';

// Custom hook for managing thread operations
export const useThreadManager = () => {
  const { id: currentThreadId } = useParams();
  const router = useNavigate();
  const [threadCollection, setThreadCollection] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load threads instantly from local storage
  const loadThreads = useCallback(() => {
    const threads = HybridDB.getThreads();
    setThreadCollection(threads);
    setIsLoading(false);
  }, []);

  // Handle thread updates from the hybrid database
  const handleThreadsUpdated = useCallback((threads: Thread[]) => {
    setThreadCollection(threads);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initial load from local storage (instant)
    loadThreads();

    // Listen for real-time updates
    dbEvents.on('threads_updated', handleThreadsUpdated);

    return () => {
      dbEvents.off('threads_updated', handleThreadsUpdated);
    };
  }, [loadThreads, handleThreadsUpdated]);

  const navigateToThread = useCallback((threadId: string) => {
    if (currentThreadId === threadId) {
      return;
    }
    router(`/chat/${threadId}`);
  }, [currentThreadId, router]);

  const removeThread = useCallback(async (threadId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      // Instant local update + async backend sync
      await HybridDB.deleteThread(threadId);
      
      // Navigate away if we're deleting the current thread
      if (currentThreadId === threadId) {
        router(`/chat`);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  }, [currentThreadId, router]);

  const isActiveThread = useCallback((threadId: string) => 
    currentThreadId === threadId, [currentThreadId]);

  return {
    currentThreadId,
    threadCollection,
    navigateToThread,
    removeThread,
    isActiveThread,
    isLoading,
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
