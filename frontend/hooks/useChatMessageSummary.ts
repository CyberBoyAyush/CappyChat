import { toast } from "@/frontend/components/ui/Toast";
import { HybridDB } from "@/lib/hybridDB";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useCallback, useRef, useState } from "react";

interface MessageSummaryPayload {
  title: string;
  isTitle?: boolean;
  messageId: string;
  threadId: string;
}

export const useChatMessageSummary = () => {
  const { openRouterApiKey } = useBYOKStore();
  const { user, isGuest } = useAuth();
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const complete = useCallback(
    async (
      prompt: string,
      options?: {
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
      }
    ) => {
      if (!prompt?.trim()) {
        return;
      }

      const baseBody = {
        prompt,
        userApiKey: openRouterApiKey,
        userId: user?.$id,
        isGuest,
      };

      setIsLoading(true);

      try {
        const response = await fetch("/api/ai-text-generation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
          },
          body: JSON.stringify({ ...baseBody, ...(options?.body ?? {}) }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const errorMessage =
            (errorPayload as { error?: string } | null)?.error ??
            "Failed to generate a summary for the message";
          toast.error(errorMessage);
          return;
        }

        const payload = (await response.json()) as MessageSummaryPayload & {
          error?: string;
        };

        if (payload.error) {
          toast.error(payload.error);
          return;
        }

        const { title, isTitle, messageId, threadId } = payload;

        if (!title || !messageId || !threadId) {
          console.error("[useChatMessageSummary] Invalid payload:", payload);
          return;
        }

        if (processedMessagesRef.current.has(messageId)) {
          return;
        }
        processedMessagesRef.current.add(messageId);

        console.log("[useChatMessageSummary] Received response:", {
          title,
          isTitle,
          messageId,
          threadId,
        });

        if (isTitle) {
          // Update thread title instantly with local update + async backend sync
          console.log("[useChatMessageSummary] Updating thread title:", title);
          await HybridDB.updateThread(threadId, title);
          await HybridDB.createMessageSummary(threadId, messageId, title);
        } else {
          // Create message summary instantly with local update + async backend sync
          await HybridDB.createMessageSummary(threadId, messageId, title);
        }
      } catch (error) {
        console.error(
          "[useChatMessageSummary] Error processing message summary:",
          error
        );
        toast.error("Failed to generate a summary for the message");
      } finally {
        setIsLoading(false);
      }
    },
    [openRouterApiKey, user?.$id, isGuest]
  );

  return {
    complete,
    isLoading,
  };
};
