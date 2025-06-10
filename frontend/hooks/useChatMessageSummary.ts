import { useCompletion } from '@ai-sdk/react';
import { useAPIKeyStore } from '@/frontend/stores/ApiKeyStore';
import { toast } from 'sonner';
import { createMessageSummary, updateThread } from '@/frontend/database/chatQueries';

interface MessageSummaryPayload {
  title: string;
  isTitle?: boolean;
  messageId: string;
  threadId: string;
}

export const useChatMessageSummary = () => {
  const getKey = useAPIKeyStore((state) => state.getKey);

  const { complete, isLoading } = useCompletion({
    api: '/api/ai-text-generation',
    ...(getKey('google') && {
      headers: { 'X-Google-API-Key': getKey('google')! },
    }),
    onResponse: async (response) => {
      try {
        const payload: MessageSummaryPayload = await response.json();

        if (response.ok) {
          const { title, isTitle, messageId, threadId } = payload;

          if (isTitle) {
            await updateThread(threadId, title);
            await createMessageSummary(threadId, messageId, title);
          } else {
            await createMessageSummary(threadId, messageId, title);
          }
        } else {
          toast.error('Failed to generate a summary for the message');
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

  return {
    complete,
    isLoading,
  };
};
