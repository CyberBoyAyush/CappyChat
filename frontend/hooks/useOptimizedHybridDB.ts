/**
 * Optimized HybridDB Hook
 * 
 * Provides optimized access to HybridDB with request deduplication,
 * caching, and performance monitoring.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { HybridDB, dbEvents } from '@/lib/hybridDB';
import { Thread, DBMessage } from '@/lib/appwriteDB';

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Performance monitoring
let totalRequests = 0;
let cacheHits = 0;

export const useOptimizedThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const handleThreadsUpdated = useCallback((updatedThreads: Thread[]) => {
    console.log('[useOptimizedThreads] Received threads_updated event with', updatedThreads.length, 'threads');
    if (mountedRef.current) {
      // Use scheduler task to avoid lifecycle method issues
      setTimeout(() => {
        if (mountedRef.current) {
          setThreads(updatedThreads);
          setIsLoading(false);
          console.log('[useOptimizedThreads] State updated via scheduler task');
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Load threads immediately from local cache
    const localThreads = HybridDB.getThreads();
    setThreads(localThreads);
    setIsLoading(false);

    // Listen for updates
    dbEvents.on('threads_updated', handleThreadsUpdated);

    return () => {
      mountedRef.current = false;
      dbEvents.off('threads_updated', handleThreadsUpdated);
    };
  }, [handleThreadsUpdated]);

  return { threads, isLoading };
};

// New hook with pagination support
export const useOptimizedThreadsWithPagination = (pageSize: number = 40) => {
  const [priorityThreads, setPriorityThreads] = useState<Thread[]>([]);
  const [regularThreads, setRegularThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const mountedRef = useRef(true);

  // Combine priority and regular threads for the final thread list
  // Priority threads (pinned + project) always come first for instant access
  const allThreads = [...priorityThreads, ...regularThreads];

  const handleThreadsUpdated = useCallback((updatedThreads: Thread[]) => {
    console.log('[useOptimizedThreadsWithPagination] Received threads_updated event with', updatedThreads.length, 'threads');
    if (mountedRef.current) {
      // Separate priority threads (pinned and project threads) from regular threads
      const priority = updatedThreads.filter(thread => thread.isPinned || thread.projectId);
      const regular = updatedThreads.filter(thread => !thread.isPinned && !thread.projectId);
      
      setTimeout(() => {
        if (mountedRef.current) {
          setPriorityThreads(priority);
          setRegularThreads(regular);
          setIsLoading(false);
          console.log('[useOptimizedThreadsWithPagination] State updated via scheduler task');
        }
      }, 0);
    }
  }, []);

  // Load more regular threads
  const loadMoreThreads = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const result = await HybridDB.loadRegularThreadsPaginated(pageSize, currentOffset);
      
      if (mountedRef.current) {
        setRegularThreads(prev => {
          // Remove duplicates and append new threads
          const existingIds = new Set(prev.map(t => t.id));
          const newThreads = result.threads.filter(t => !existingIds.has(t.id));
          return [...prev, ...newThreads];
        });
        setHasMore(result.hasMore);
        setCurrentOffset(prev => prev + pageSize);
      }
    } catch (error) {
      console.error('Error loading more threads:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, hasMore, currentOffset, pageSize]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    
    const loadInitialData = async () => {
      try {
        // Phase 1: Load threads immediately from local cache for instant UI (snappy experience)
        const localThreads = HybridDB.getThreads();
        const localPriority = localThreads.filter(thread => thread.isPinned || thread.projectId);
        const localRegular = localThreads.filter(thread => !thread.isPinned && !thread.projectId);
        
        // Show local data immediately for snappy experience
        setPriorityThreads(localPriority);
        setRegularThreads(localRegular.slice(0, pageSize));
        setIsLoading(false);

        // Phase 2: Load priority threads from remote in parallel for instant access
        // These are pinned and project threads that should always be available
        const remotePriorityPromise = HybridDB.loadPriorityThreadsFromRemote();
        
        // Phase 3: Load first 40 regular threads from remote in parallel
        const firstPagePromise = HybridDB.loadRegularThreadsPaginated(pageSize, 0);

        // Execute both remote calls in parallel for better performance
        const [remotePriority, firstPageResult] = await Promise.all([
          remotePriorityPromise,
          firstPagePromise
        ]);

        if (mountedRef.current) {
          // Update priority threads (pinned + project threads)
          setPriorityThreads(remotePriority);
          
          // Update regular threads with first 40 from remote
          setRegularThreads(firstPageResult.threads);
          setHasMore(firstPageResult.hasMore);
          setCurrentOffset(pageSize);
        }
      } catch (error) {
        console.error('Error loading initial thread data:', error);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    // Listen for real-time updates
    dbEvents.on('threads_updated', handleThreadsUpdated);

    return () => {
      mountedRef.current = false;
      dbEvents.off('threads_updated', handleThreadsUpdated);
    };
  }, [handleThreadsUpdated, pageSize]);

  return { 
    threads: allThreads, 
    priorityThreads,
    regularThreads,
    isLoading, 
    isLoadingMore,
    hasMore,
    loadMoreThreads
  };
};

export const useOptimizedMessages = (threadId: string) => {
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const requestIdRef = useRef<string>('');

  const handleMessagesUpdated = useCallback((updatedThreadId: string, updatedMessages: DBMessage[]) => {
    if (mountedRef.current && updatedThreadId === threadId) {
      setMessages(updatedMessages);
      setIsLoading(false);
    }
  }, [threadId]);

  const loadMessages = useCallback(async () => {
    if (!threadId) return;

    totalRequests++;
    const requestId = `messages_${threadId}_${Date.now()}`;
    requestIdRef.current = requestId;

    try {
      setIsLoading(true);

      // Check if there's already a pending request for this thread
      const cacheKey = `loadMessages_${threadId}`;
      let messagePromise = requestCache.get(cacheKey);

      if (messagePromise) {
        cacheHits++;
        console.log(`Cache hit for ${threadId}. Hit rate: ${(cacheHits/totalRequests*100).toFixed(1)}%`);
      } else {
        // Load local messages first for instant UI
        const localMessages = HybridDB.getMessagesByThreadId(threadId);
        if (localMessages.length > 0 && mountedRef.current) {
          setMessages(localMessages);
          setIsLoading(false);
        }

        // Create new request
        messagePromise = HybridDB.loadMessagesFromRemote(threadId);
        requestCache.set(cacheKey, messagePromise);

        // Clear cache after request completes
        messagePromise.finally(() => {
          requestCache.delete(cacheKey);
        });
      }

      const result = await messagePromise;
      
      // Only update if this is still the current request
      if (mountedRef.current && requestIdRef.current === requestId) {
        setMessages(result || []);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (mountedRef.current && requestIdRef.current === requestId) {
        // Fallback to local messages
        const localMessages = HybridDB.getMessagesByThreadId(threadId);
        setMessages(localMessages || []);
        setIsLoading(false);
      }
    }
  }, [threadId]);

  useEffect(() => {
    mountedRef.current = true;
    loadMessages();

    // Listen for real-time updates
    dbEvents.on('messages_updated', handleMessagesUpdated);

    return () => {
      mountedRef.current = false;
      dbEvents.off('messages_updated', handleMessagesUpdated);
    };
  }, [loadMessages, handleMessagesUpdated]);

  return { messages, isLoading, reload: loadMessages };
};

// Performance monitoring utilities
export const getPerformanceStats = () => ({
  totalRequests,
  cacheHits,
  hitRate: totalRequests > 0 ? (cacheHits / totalRequests * 100) : 0,
  pendingRequests: requestCache.size
});

export const clearPerformanceStats = () => {
  totalRequests = 0;
  cacheHits = 0;
  requestCache.clear();
};
