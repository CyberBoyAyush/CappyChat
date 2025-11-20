/**
 * ChatHomePage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as default chat route)
 * Purpose: Landing page for new chat sessions. Shows API key setup if not configured,
 * otherwise displays the main chat interface with a new thread.
 * Supports search redirection via ?q= URL parameter for quick searches.
 */

import ChatInterface from '@/frontend/components/ChatInterface';
import { v4 as uuidv4 } from 'uuid';
import { useModelStore } from '../stores/ChatModelStore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { HybridDB } from '@/lib/hybridDB';
import { useAuth } from '@/frontend/contexts/AuthContext';

export default function ChatHomePage() {
  const isModelStoreHydrated = useModelStore.persist?.hasHydrated();
  const [searchParams] = useSearchParams();
  const { isGuest, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Extract and decode the search query from URL parameter
  const searchQuery = useMemo(() => {
    const q = searchParams.get('q');
    if (!q) return null;

    try {
      // Decode URL-encoded query (handles %20 for spaces, etc.)
      return decodeURIComponent(q);
    } catch (error) {
      console.warn('Failed to decode search query:', error);
      return q; // Fallback to raw query if decoding fails
    }
  }, [searchParams]);

  // Generate stable thread ID for this session
  const threadId = useMemo(() => uuidv4(), []);

  // Handle URL search query - create thread and navigate to dedicated thread page
  useEffect(() => {
    // Wait for authentication to be fully loaded before making decisions
    if (authLoading) {
      console.log('🔄 Waiting for authentication to load...');
      return;
    }

    if (searchQuery && searchQuery.trim()) {
      console.log('🔧 URL search detected, creating new thread:', threadId);
      console.log('🔍 Auth state - isGuest:', isGuest, 'authLoading:', authLoading);

      // For authenticated users, create the thread in the database
      if (!isGuest) {
        console.log('👤 Authenticated user - creating thread in database');
        HybridDB.createThread(threadId).then(() => {
          console.log('✅ Thread created successfully for URL search:', threadId);
          // Navigate to the dedicated thread page with search query in state
          navigate(`/chat/${threadId}`, {
            replace: true,
            state: { searchQuery }
          });
        }).catch((error) => {
          console.error('❌ Failed to create thread for URL search:', error);
          // Still navigate even if thread creation fails (will be created on first message)
          navigate(`/chat/${threadId}`, {
            replace: true,
            state: { searchQuery }
          });
        });
      } else {
        // For guest users, just navigate to the thread page (no DB storage)
        console.log('🎯 Guest user URL search, navigating to thread page:', threadId);
        navigate(`/chat/${threadId}`, {
          replace: true,
          state: { searchQuery }
        });
      }
    }
  }, [searchQuery, threadId, isGuest, authLoading, navigate]);

  // Show loading state while authentication is loading
  if (authLoading || !isModelStoreHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a search query, don't render the interface here - let the navigation handle it
  if (searchQuery && searchQuery.trim()) {
    return null; // Will navigate to thread page
  }

  return (
    <ChatInterface
      threadId={threadId}
      messages={[]}
      searchQuery={null} // No search query for regular home page
    />
  );
}
