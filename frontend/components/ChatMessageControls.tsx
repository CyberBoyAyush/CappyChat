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
        "opacity-60 group-hover:opacity-100 transition-all duration-200 flex gap-1 items-center",
        "relative z-10 pointer-events-auto"
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className={cn(
          "h-7 w-7 p-0 rounded-md hover:bg-accent/50 transition-all duration-200",
          "border border-border/30 hover:border-border/60 bg-card/30 backdrop-blur-sm",
          copied && "bg-green-500/10 border-green-500/30 text-green-600"
        )}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
      {setMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode("edit")}
          className={cn(
            "h-7 w-7 p-0 rounded-md hover:bg-accent/50 transition-all duration-200",
            "border border-border/30 hover:border-border/60 bg-card/30 backdrop-blur-sm"
          )}
        >
          <SquarePen className="w-3.5 h-3.5" />
        </Button>
      )}
      <div className="relative z-20">
        <RetryDropdown onRetry={handleRegenerate} />
      </div>
    </div>
  );
}
