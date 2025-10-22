/**
 * ChatMessageEditor Component
 *
 * Used in: frontend/components/Message.tsx
 * Purpose: Provides inline editing functionality for user messages.
 * Allows users to edit their messages and regenerate AI responses from that point.
 */

import { AppwriteDB } from "@/lib/appwriteDB";
import { HybridDB } from "@/lib/hybridDB";
import { UseChatHelpers, useCompletion } from "@ai-sdk/react";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useState } from "react";
import { UIMessage } from "ai";
import { Dispatch, SetStateAction } from "react";
import { v4 as uuidv4 } from "uuid";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { toast } from "@/frontend/components/ui/Toast";

export default function MessageEditor({
  threadId,
  message,
  content,
  setMessages,
  reload,
  setMode,
  stop,
}: {
  threadId: string;
  message: UIMessage;
  content: string;
  setMessages: UseChatHelpers["setMessages"];
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  reload: UseChatHelpers["reload"];
  stop: UseChatHelpers["stop"];
}) {
  const [draftContent, setDraftContent] = useState(content);
  const { openRouterApiKey } = useBYOKStore();
  const { user, isGuest } = useAuth();

  const { complete } = useCompletion({
    api: "/api/ai-text-generation",
    body: {
      userApiKey: openRouterApiKey,
      userId: user?.$id,
      isGuest: isGuest,
    },
    onResponse: async (response) => {
      try {
        const payload = await response.json();

        if (response.ok) {
          const { title, messageId, threadId } = payload;
          await HybridDB.createMessageSummary(threadId, messageId, title);
        } else {
          toast.error(
            payload.error || "Failed to generate a summary for the message"
          );
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

  const handleSave = async () => {
    try {
      await HybridDB.deleteTrailingMessages(
        threadId,
        message.createdAt as Date
      );

      const updatedMessage = {
        ...message,
        id: uuidv4(),
        content: draftContent,
        parts: [
          {
            type: "text" as const,
            text: draftContent,
          },
        ],
        createdAt: new Date(),
        // Preserve the model field if it exists (for assistant messages)
        model: (message as any).model,
      };

      await HybridDB.createMessage(threadId, updatedMessage);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index), updatedMessage];
        }

        return messages;
      });

      complete(draftContent, {
        body: {
          messageId: updatedMessage.id,
          threadId,
        },
      });
      setMode("view");

      // stop the current stream if any
      stop();

      setTimeout(() => {
        reload();
      }, 0);
    } catch (error) {
      console.error("Failed to save message:", error);
      toast.error("Failed to save message");
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl ">
        <Textarea
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Edit your message…"
          className="md:w-lg h-28  field-sizing-fixed border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent resize-none text-foreground placeholder:text-muted-foreground/60"
        />
        <div className="mt-1 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full bg-background/60 text-foreground hover:bg-background/80 px-4 h-8"
            onClick={() => setMode("view")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-accent-foreground/80 hover:bg-accent-foreground px-4 h-8"
            onClick={handleSave}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
