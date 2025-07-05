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
import { useOptimizedThreadsWithPagination } from '@/frontend/hooks/useOptimizedHybridDB';
import { useIsMobile } from '@/hooks/useMobileDetection';
import { useOutletContext } from 'react-router-dom';

// Custom hook for managing thread operations
export const useThreadManager = () => {
  const { id: currentThreadId } = useParams();
  const router = useNavigate();
  const isMobile = useIsMobile();
  
  // Get sidebar controls from outlet context
  const outletContext = useOutletContext<{
    sidebarWidth: number;
    toggleSidebar: () => void;
    state: "open" | "collapsed";
    isMobile: boolean;
  } | null>();
  
  // Use optimized hook with pagination for better performance
  const { 
    threads: threadCollection, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMoreThreads 
  } = useOptimizedThreadsWithPagination(40);

  const navigateToThread = useCallback((threadId: string) => {
    if (currentThreadId === threadId) {
      return;
    }
    router(`/chat/${threadId}`);
    
    // Close sidebar on mobile after navigation
    if (isMobile && outletContext?.toggleSidebar) {
      outletContext.toggleSidebar();
    }
  }, [currentThreadId, router, isMobile, outletContext]);

  const removeThread = useCallback(async (threadId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Instant local update + async backend sync
      await HybridDB.deleteThread(threadId);

      // Navigate away if we're deleting the current thread
      if (currentThreadId === threadId) {
        router(`/chat`);
      }

      // Close sidebar on mobile after deletion
      if (isMobile && outletContext?.toggleSidebar) {
        outletContext.toggleSidebar();
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error; // Re-throw so the dialog can handle the error
    }
  }, [currentThreadId, router, isMobile, outletContext]);

  const toggleThreadPin = useCallback(async (threadId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Find the current thread to get its pin status
      const thread = threadCollection.find((t: Thread) => t.id === threadId);
      if (!thread) {
        console.error('Thread not found:', threadId);
        return;
      }

      // Toggle pin status
      const newPinStatus = !thread.isPinned;

      // Instant local update + async backend sync
      await HybridDB.updateThreadPinStatus(threadId, newPinStatus);
    } catch (error) {
      console.error('Error toggling thread pin status:', error);
      throw error;
    }
  }, [threadCollection]);

  const renameThread = useCallback(async (threadId: string, newTitle: string) => {
    try {
      // Instant local update + async backend sync
      await HybridDB.updateThread(threadId, newTitle);
    } catch (error) {
      console.error('Error renaming thread:', error);
      throw error;
    }
  }, []);

  const updateThreadTags = useCallback(async (threadId: string, tags: string[]) => {
    try {
      // Instant local update + async backend sync
      await HybridDB.updateThreadTags(threadId, tags);
    } catch (error) {
      console.error('Error updating thread tags:', error);
      throw error;
    }
  }, []);

  const branchThread = useCallback(async (threadId: string, newTitle?: string) => {
    try {
      // Generate new thread ID
      const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Instant local update + async backend sync
      await HybridDB.branchThread(threadId, newThreadId, newTitle);

      // Navigate to the new branched thread
      router(`/chat/${newThreadId}`);

      // Close sidebar on mobile after navigation
      if (isMobile && outletContext?.toggleSidebar) {
        outletContext.toggleSidebar();
      }

      return newThreadId;
    } catch (error) {
      console.error('Error branching thread:', error);
      throw error;
    }
  }, [router, isMobile, outletContext]);

  const isActiveThread = useCallback((threadId: string) =>
    currentThreadId === threadId, [currentThreadId]);

  return {
    currentThreadId,
    threadCollection,
    navigateToThread,
    removeThread,
    toggleThreadPin,
    renameThread,
    updateThreadTags,
    branchThread,
    isActiveThread,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreThreads,
  };
};

// Thread data interface
export interface ThreadData {
  id: string;
  title: string;
  isPinned: boolean;
  tags?: string[];
  isBranched?: boolean;
  projectId?: string;
}

// Thread operations interface
export interface ThreadOperations {
  onNavigate: (threadId: string) => void;
  onDelete: (threadId: string, event?: React.MouseEvent) => void;
  onTogglePin: (threadId: string, event?: React.MouseEvent) => void;
  onRename: (threadId: string, newTitle: string) => void;
  onUpdateTags: (threadId: string, tags: string[]) => void;
  onBranch: (threadId: string, newTitle?: string) => void;
  isActive: boolean;
}
