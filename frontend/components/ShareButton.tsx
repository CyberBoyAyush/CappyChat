/**
 * ShareButton Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Provides sharing functionality for chat threads with copy link feature.
 * Allows users to generate and copy public share links for their conversations.
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Share2, Check, Copy, Loader2 } from "lucide-react";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { HybridDB } from "@/lib/hybridDB";
import { SendIcon } from "./ui/icons/SendIcon";

interface ShareButtonProps {
  threadId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ShareButton({
  threadId,
  className,
  variant = "outline",
  size = "icon",
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { isGuest } = useAuth();

  // Don't show share button for guest users
  if (isGuest) {
    return null;
  }

  const handleShare = async () => {
    if (shareUrl) {
      // If we already have a share URL, just copy it
      await handleCopy();
      return;
    }

    setIsSharing(true);
    try {
      // Use HybridDB for instant local updates + async remote sync
      const shareId = await HybridDB.shareThread(threadId);
      const newShareUrl = `${window.location.origin}/share/${shareId}`;
      setShareUrl(newShareUrl);

      // Automatically copy the link after creation
      await navigator.clipboard.writeText(newShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error creating share link:", error);
      // You could add a toast notification here
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const getButtonContent = () => {
    if (isSharing) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }

    if (copied) {
      return <Check className="h-5 w-5" />;
    }

    if (shareUrl) {
      return <Copy className="h-5 w-5" />;
    }

    return <SendIcon className="h-5 w-5" />;
  };

  const getAriaLabel = () => {
    if (isSharing) return "Creating share link...";
    if (copied) return "Link copied!";
    if (shareUrl) return "Copy share link";
    return "Share conversation";
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      disabled={isSharing}
      className={cn(
        "focus:outline-none focus:ring-0 shadow-sm rounded-md transition-all duration-200",
        copied && "bg-green-500/10 border-green-500/30 text-green-600",
        className
      )}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      {getButtonContent()}
    </Button>
  );
}
