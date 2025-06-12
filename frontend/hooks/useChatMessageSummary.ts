import { useCompletion } from '@ai-sdk/react';
import { toast } from 'sonner';
import { AppwriteDB } from '@/lib/appwriteDB';
import { HybridDB } from '@/lib/hybridDB';

interface MessageSummaryPayload {
  title: string;
  isTitle?: boolean;
  messageId: string;
  threadId: string;
}

export const useChatMessageSummary = () => {
  const { complete, isLoading } = useCompletion({
    api: '/api/ai-text-generation',
    onResponse: async (response) => {
      try {
        const payload: MessageSummaryPayload = await response.json();

        if (response.ok) {
          const { title, isTitle, messageId, threadId } = payload;

          if (isTitle) {
            // Update thread title instantly with local update + async backend sync
            HybridDB.updateThread(threadId, title);
            HybridDB.createMessageSummary(threadId, messageId, title);
          } else {
            // Create message summary instantly with local update + async backend sync
            HybridDB.createMessageSummary(threadId, messageId, title);
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
