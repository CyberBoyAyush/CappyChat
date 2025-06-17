/**
 * MessageControls Component
 *
 * Used in: frontend/components/Message.tsx
 * Purpose: Provides action buttons for messages including copy, edit, and regenerate functionality.
 * Appears below each message to allow user interaction with message content.
 */

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, SquarePen } from "lucide-react";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { AppwriteDB } from "@/lib/appwriteDB";
import { HybridDB } from "@/lib/hybridDB";
import RetryDropdown from "./RetryDropdown";
import { AIModel } from "@/lib/models";

interface MessageControlsProps {
  threadId: string;
  message: UIMessage;
  setMessages: UseChatHelpers["setMessages"];
  content: string;
  setMode?: Dispatch<SetStateAction<"view" | "edit">>;
  reload: UseChatHelpers["reload"];
  stop: UseChatHelpers["stop"];
  onRetryWithModel?: (model?: AIModel, message?: UIMessage) => void;
}

export default function MessageControls({
  threadId,
  message,
  setMessages,
  content,
  setMode,
  reload,
  stop,
  onRetryWithModel,
}: MessageControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleRegenerate = async (model?: AIModel) => {
    // If we have a callback, use it and pass the message information
    if (onRetryWithModel) {
      onRetryWithModel(model, message);
      return;
    }

    // Fallback to original logic if no callback provided
    // stop the current request
    stop();

    if (message.role === "user") {
      await HybridDB.deleteTrailingMessages(threadId, message.createdAt as Date, false);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index + 1)];
        }

        return messages;
      });
    } else {
      await HybridDB.deleteTrailingMessages(threadId, message.createdAt as Date);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          return [...messages.slice(0, index)];
        }

        return messages;
      });
    }

    setTimeout(() => {
      reload();
    }, 0);
  };

  return (
    <div
      className={cn(
        "opacity-55 group-hover:opacity-100 transition-opacity duration-100 flex gap-1",
        {
          "absolute mt-5 right-2": message.role === "user",
        }
      )}
    >
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
      {setMode && (
        <Button variant="ghost" size="icon" onClick={() => setMode("edit")}>
          <SquarePen className="w-4 h-4" />
        </Button>
      )}
      <RetryDropdown onRetry={handleRegenerate} />
    </div>
  );
}
