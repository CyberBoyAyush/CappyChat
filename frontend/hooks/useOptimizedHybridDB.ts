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
    if (mountedRef.current) {
      setThreads(updatedThreads);
      setIsLoading(false);
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
