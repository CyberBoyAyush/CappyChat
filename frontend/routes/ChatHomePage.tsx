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
import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

export default function ChatHomePage() {
  const isModelStoreHydrated = useModelStore.persist?.hasHydrated();
  const [searchParams] = useSearchParams();

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

  if (!isModelStoreHydrated) return null;

  return (
    <ChatInterface
      threadId={threadId}
      initialMessages={[]}
      searchQuery={searchQuery}
    />
  );
}
