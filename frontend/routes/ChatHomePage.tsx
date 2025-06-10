/**
 * ChatHomePage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as default chat route)
 * Purpose: Landing page for new chat sessions. Shows API key setup if not configured,
 * otherwise displays the main chat interface with a new thread.
 */

import ApiKeyConfigForm from '@/frontend/components/ApiKeyConfigForm';
import ChatInterface from '@/frontend/components/ChatInterface';
import { v4 as uuidv4 } from 'uuid';
import { useAPIKeyStore } from '../stores/ApiKeyStore';
import { useModelStore } from '../stores/ChatModelStore';

export default function ChatHomePage() {
  const hasRequiredKeys = useAPIKeyStore((state) => state.hasRequiredKeys());

  const isAPIKeysHydrated = useAPIKeyStore.persist?.hasHydrated();
  const isModelStoreHydrated = useModelStore.persist?.hasHydrated();

  if (!isAPIKeysHydrated || !isModelStoreHydrated) return null;

  if (!hasRequiredKeys)
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-background mobile-container mobile-padding py-8">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome to ATChat
            </h1>
            <p className="text-muted-foreground mobile-text max-w-md mx-auto">
              Get started by configuring your API keys to begin chatting with AI models.
            </p>
          </div>
          <ApiKeyConfigForm />
        </div>
      </div>
    );

  return <ChatInterface threadId={uuidv4()} initialMessages={[]} />;
}
