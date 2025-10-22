/**
 * ChatMessageBrowser Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Provides a navigation panel to browse and jump to specific messages in a chat thread.
 * Shows message summaries and allows quick navigation to any message in the conversation.
 */

import { useState, useEffect, useCallback } from "react";
import { HybridDB, dbEvents } from "@/lib/hybridDB";
import { AppwriteDB } from "@/lib/appwriteDB";
import { memo } from "react";
import { X, MessageCircle, Bot, User, Search, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { devWarn, devError } from "@/lib/logger";

interface MessageBrowserProps {
  threadId: string;
  scrollToMessage: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface MessageSummaryWithRole {
  id: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: Date;
  role: "user" | "assistant" | "system" | "data";
}

function PureMessageBrowser({
  threadId,
  scrollToMessage,
  isVisible,
  onClose,
}: MessageBrowserProps) {
  const [messageSummaries, setMessageSummaries] = useState<
    MessageSummaryWithRole[]
  >([]);
  const { isGuest } = useAuth();

  // Handle message summary updates from the hybrid database
  const handleSummariesUpdated = useCallback(
    async (updatedThreadId: string) => {
      if (updatedThreadId === threadId) {
        try {
          // For guest users, only load from local storage
          if (isGuest) {
            const summaries = await HybridDB.getMessageSummariesWithRole(
              threadId
            );
            setMessageSummaries(summaries || []);
            return;
          }

          // For authenticated users, try to get the latest from remote first
          try {
            const remoteSummaries =
              await AppwriteDB.getMessageSummariesWithRole(threadId);
            setMessageSummaries(remoteSummaries || []);
          } catch (remoteError) {
            // Fallback to local if remote fails
            devWarn(
              "Failed to load remote summaries, using local:",
              remoteError
            );
            const localSummaries = await HybridDB.getMessageSummariesWithRole(
              threadId
            );
            setMessageSummaries(localSummaries || []);
          }
        } catch (error) {
          devError("Error loading updated summaries:", error);
        }
      }
    },
    [threadId, isGuest]
  );

  useEffect(() => {
    let isMounted = true;

    const loadMessageSummaries = async () => {
      try {
        // For guest users, only load from local storage
        if (isGuest) {
          const summaries = await HybridDB.getMessageSummariesWithRole(
            threadId
          );
          if (isMounted) {
            setMessageSummaries(summaries || []);
          }
          return;
        }

        // For authenticated users, first load from local storage for instant display
        const localSummaries = await HybridDB.getMessageSummariesWithRole(
          threadId
        );
        if (isMounted) {
          setMessageSummaries(localSummaries || []);
        }

        // Then sync with Appwrite to get the latest summaries
        try {
          const remoteSummaries = await AppwriteDB.getMessageSummariesWithRole(
            threadId
          );
          if (isMounted && remoteSummaries.length > 0) {
            // Replace with remote summaries
            setMessageSummaries(remoteSummaries);

            // Emit update event for other components
            dbEvents.emit("summaries_updated", threadId);
          }
        } catch (remoteError) {
          devWarn(
            "Failed to sync summaries from remote, using local:",
            remoteError
          );
          // Keep using local summaries if remote fails
        }
      } catch (error) {
        devError("Error loading message summaries:", error);
        if (isMounted) {
          setMessageSummaries([]);
        }
      }
    };

    if (threadId) {
      loadMessageSummaries();

      // Listen for real-time summary updates
      dbEvents.on("summaries_updated", handleSummariesUpdated);
    }

    return () => {
      isMounted = false;
      dbEvents.off("summaries_updated", handleSummariesUpdated);
    };
  }, [threadId, handleSummariesUpdated, isGuest]);

  const formatTimeAgo = (createdAt: Date | string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <>
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 h-full w-80 sm:w-96 lg:w-[420px] bg-background/95 backdrop-blur-xl border-l border-border/50 z-50",
          "transform transition-all duration-300 ease-out shadow-2xl",
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-background/10 before:to-transparent before:pointer-events-none",
          "max-w-[90vw] lg:max-w-none", // Responsive width limits
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50 bg-gradient-to-r from-card/50 to-card/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Message Browser
                </h3>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Navigate your conversation
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-xl group"
              aria-label="Close browser"
            >
              <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </Button>
          </div>

          {/* Stats Section */}
          <div className="p-3 sm:p-4 border-b border-border/20 bg-gradient-to-r from-muted/10 to-muted/5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                {/* <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div> */}
                <span className="font-medium">
                  {messageSummaries?.length || 0} messages
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-hidden">
            {!messageSummaries ? (
              // Loading state
              <div className="h-full overflow-y-auto">
                <div className="p-2 space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-muted/40"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted/40 rounded-md w-3/4"></div>
                          <div className="h-3 bg-muted/30 rounded-md w-1/2"></div>
                          <div className="h-3 bg-muted/20 rounded-md w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : messageSummaries.length > 0 ? (
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">
                <div className="p-2 sm:p-3 space-y-2">
                  {messageSummaries.map(
                    (summary: MessageSummaryWithRole, index: number) => (
                      <div
                        key={summary.id}
                        onClick={() => {
                          scrollToMessage(summary.messageId);
                          onClose(); // Close on mobile after navigation
                        }}
                        className={cn(
                          "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
                          "bg-card/30 backdrop-blur-sm border border-border/30 hover:border-primary/30",
                          "hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                        )}
                      >
                        {/* Message indicator */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {summary.role === "assistant" ? (
                              <div className="h-8 w-8  rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              </div>
                            ) : (
                              <div className="h-8 w-8  rounded-lg bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Message preview */}
                            <span className="text-sm  text-foreground/90 line-clamp-3 leading-relaxed mb-1 font-medium">
                              {summary.content.slice(
                                0,
                                window.innerWidth < 640 ? 100 : 140
                              )}
                              {summary.content.length >
                                (window.innerWidth < 640 ? 100 : 140) && (
                                <span className="text-muted-foreground">
                                  ...
                                </span>
                              )}
                            </span>

                            {/* Metadata */}
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium text-xs">
                                  {formatTimeAgo(summary.createdAt)}
                                </span>
                              </div>
                              <span className="text-muted-foreground/40 hidden sm:inline">
                                •
                              </span>
                              <div className="flex items-center text-xs gap-1">
                                <span className="capitalize font-medium text-primary">
                                  {summary.role}
                                </span>
                                {summary.role === "assistant" && (
                                  <div className="md:h-2 md:w-2 w-1 h-1 rounded-full bg-primary/60 shadow-sm"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover indicator */}
                        {/* <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-gradient-to-r from-primary to-primary/60 shadow-lg"></div>
                        </div> */}

                        {/* Message number */}
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-70 transition-opacity duration-200">
                          <div className="px-2 py-1 bg-muted/90 rounded-lg text-xs text-muted-foreground/90 font-mono backdrop-blur-sm border border-border/30">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center border border-border/20 shadow-sm">
                    <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-background border-2 border-border/20 flex items-center justify-center shadow-sm">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/60" />
                  </div>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-foreground mb-2">
                  No messages yet
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground/70 max-w-[250px] leading-relaxed">
                  Start a conversation to see your message history here. Each
                  message will be summarized for easy navigation.
                </p>
              </div>
            )}
          </div>

          {/* Footer - Optional quick stats */}
          {messageSummaries && messageSummaries.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-border/20 bg-gradient-to-r from-card/30 to-card/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary/40 shadow-sm"></div>
                  <span className="font-medium">ID: {threadId.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-3 w-3 text-primary" />
                  </div>
                  <span className="font-bold text-foreground">
                    {messageSummaries.length}
                  </span>
                  <span className="hidden sm:inline">
                    message{messageSummaries.length !== 1 ? "s" : ""}
                  </span>
                  <span className="sm:hidden">
                    msg{messageSummaries.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default memo(PureMessageBrowser, (prevProps, nextProps) => {
  return (
    prevProps.threadId === nextProps.threadId &&
    prevProps.isVisible === nextProps.isVisible
  );
});
