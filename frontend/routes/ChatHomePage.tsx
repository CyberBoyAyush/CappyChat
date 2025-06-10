/**
 * ChatHomePage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as default chat route)
 * Purpose: Landing page for new chat sessions. Shows API key setup if not configured,
 * otherwise displays the main chat interface with a new thread.
 */

import ChatInterface from '@/frontend/components/ChatInterface';
import { v4 as uuidv4 } from 'uuid';
import { useModelStore } from '../stores/ChatModelStore';

export default function ChatHomePage() {
  const isModelStoreHydrated = useModelStore.persist?.hasHydrated();

  if (!isModelStoreHydrated) return null;

  return <ChatInterface threadId={uuidv4()} initialMessages={[]} />;
}
