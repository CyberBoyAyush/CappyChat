import { useCompletion } from '@ai-sdk/react';
import { toast } from 'sonner';
import { AppwriteDB } from '@/lib/appwriteDB';
import { HybridDB } from '@/lib/hybridDB';
import { useBYOKStore } from '@/frontend/stores/BYOKStore';

interface MessageSummaryPayload {
  title: string;
  isTitle?: boolean;
  messageId: string;
  threadId: string;
}

export const useChatMessageSummary = () => {
  const { openRouterApiKey } = useBYOKStore();

  const { complete, isLoading } = useCompletion({
    api: '/api/ai-text-generation',
    body: {
      userApiKey: openRouterApiKey,
    },
    onResponse: async (response) => {
      try {
        const payload: MessageSummaryPayload = await response.json();

        if (response.ok) {
          const { title, isTitle, messageId, threadId } = payload;
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
        } else {
          toast.error('Failed to generate a summary for the message');
        }
      } catch (error) {
        console.error('Error processing message summary:', error);
      }
    },
  });

  return {
    complete,
    isLoading,
  };
};
