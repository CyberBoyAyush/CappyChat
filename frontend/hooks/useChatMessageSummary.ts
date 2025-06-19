import { useCompletion } from '@ai-sdk/react';
import { toast } from 'sonner';
import { AppwriteDB } from '@/lib/appwriteDB';
import { HybridDB } from '@/lib/hybridDB';
import { useBYOKStore } from '@/frontend/stores/BYOKStore';
import { useAuth } from '@/frontend/contexts/AuthContext';

interface MessageSummaryPayload {
  title: string;
  isTitle?: boolean;
  messageId: string;
  threadId: string;
}

export const useChatMessageSummary = () => {
  const { openRouterApiKey } = useBYOKStore();
  const { user, isGuest } = useAuth();

  const { complete, isLoading } = useCompletion({
    api: '/api/ai-text-generation',
    body: {
      userApiKey: openRouterApiKey,
      userId: user?.$id,
      isGuest: isGuest,
    },
    onResponse: async (response) => {
      try {
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          console.error('[useChatMessageSummary] API response not ok:', response.status, response.statusText);
          toast.error('Failed to generate a summary for the message');
          return;
        }

        const payload: MessageSummaryPayload = await response.json();
        const { title, isTitle, messageId, threadId } = payload;
        
        // Validate that we have the required fields
        if (!title || !messageId || !threadId) {
          console.error('[useChatMessageSummary] Invalid payload:', payload);
          return;
        }

        console.log('[useChatMessageSummary] Received response:', { title, isTitle, messageId, threadId });

        if (isTitle) {
          // Update thread title instantly with local update + async backend sync
          console.log('[useChatMessageSummary] Updating thread title:', title);
          await HybridDB.updateThread(threadId, title);
          await HybridDB.createMessageSummary(threadId, messageId, title);
        } else {
          // Create message summary instantly with local update + async backend sync
          await HybridDB.createMessageSummary(threadId, messageId, title);
        }
      } catch (error) {
        console.error('[useChatMessageSummary] Error processing message summary:', error);
        // Don't show user-facing error for title generation failures
        // The fallback mechanism in ChatInputField will handle it
      }
    },
    onError: (error) => {
      console.error('[useChatMessageSummary] Completion error:', error);
      // Don't show error toast for title generation failures to avoid user confusion
      // The thread will keep the "New Chat" title, which is acceptable fallback behavior
    },
  });

  return {
    complete,
    isLoading,
  };
};
