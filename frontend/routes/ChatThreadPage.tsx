/**
 * ChatThreadPage Route Component
 *
 * Used in: frontend/ChatAppRouter.tsx (as "/chat/:id" route)
 * Purpose: Displays an existing chat thread with its message history.
 * Loads messages from database and renders the chat interface for the specific thread.
 */

import { useCallback, useMemo, useState, useEffect } from "react";
import ChatInterface from "@/frontend/components/ChatInterface";
import { useParams, useLocation } from "react-router";
import { useOptimizedMessages } from "@/frontend/hooks/useOptimizedHybridDB";
import { UIMessage } from "ai";
import { Skeleton } from "@/frontend/components/ui/BasicComponents";
import { MessageLoading } from "@/frontend/components/ui/UIComponents";

export default function ChatThreadPage() {
  const { id } = useParams();
  const location = useLocation();
  if (!id) throw new Error("Thread ID is required");

  // Check if this thread was created from a URL search query
  // This can happen when navigating from ChatHomePage with a search query
  const searchQuery = useMemo(() => {
    // Check if we have search query in location state (from navigation)
    if (location.state?.searchQuery) {
      return location.state.searchQuery;
    }

    // Also check current URL params as fallback
    const urlParams = new URLSearchParams(location.search);
    const q = urlParams.get("q");
    if (q) {
      try {
        return decodeURIComponent(q);
      } catch (error) {
        console.warn("Failed to decode search query:", error);
        return q;
      }
    }

    return null;
  }, [location.state, location.search]);

  // Use optimized hook for better performance
  const { messages, isLoading } = useOptimizedMessages(id);

  // Add minimum loading time to prevent flickering
  const [showLoading, setShowLoading] = useState(true);
  const [loadingStartTime] = useState(() => Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - loadingStartTime;
      const minLoadingTime = 1000; // 500ms minimum loading time

      if (elapsed < minLoadingTime) {
        // Wait for the remaining time to reach minimum loading duration
        const remainingTime = minLoadingTime - elapsed;
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, remainingTime);

        return () => clearTimeout(timer);
      } else {
        // Minimum time already elapsed, hide loading immediately
        setShowLoading(false);
      }
    } else {
      // Reset loading state when isLoading becomes true again
      setShowLoading(true);
    }
  }, [isLoading, loadingStartTime]);

  const convertToUIMessages = useCallback((messages?: any[]) => {
    console.log(
      "🔄 Converting messages to UI format:",
      messages?.length,
      "messages"
    );
    return messages?.map((message) => {
      if (message.attachments && message.attachments.length > 0) {
        console.log(
          "📎 Message with attachments found:",
          message.id,
          "Attachments:",
          message.attachments
        );
      }
      return {
        id: message.id,
        role: message.role,
        parts: message.parts as UIMessage["parts"],
        content: message.content || "",
        createdAt: message.createdAt,
        webSearchResults: message.webSearchResults,
        attachments: message.attachments, // ✅ Include attachments!
        model: message.model, // ✅ Include model field!
        imgurl: message.imgurl, // ✅ Include imgurl field!
      };
    });
  }, []);

  if (showLoading) {
    return (
      <div className="flex flex-col justify-center bg-background  h-screen p-4 md:px-14 w-full mx-auto">
        {/* Chat header skeleton with improved animation */}
        <div className="flex items-center mb-6 px-2 py-2">
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
            <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Chat messages skeleton with staggered animations */}
        <div className="w-full justify-center align-middle self-center">
          <div className="space-y-6 self-center mx-auto flex-grow overflow-hidden px-2 max-w-4xl sm:px-4">
            {/* First user message skeleton */}
            <div className="flex justify-end  fade-in  duration-500">
              <div className="h-6 w-6 mr-2 rounded-full bg-primary/20 flex items-center justify-center">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="bg-background/20 rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[75%] shadow-sm">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* First AI message skeleton with animated typing indicator */}
            <div className="flex justify-start  fade-in  duration-500 delay-200">
              <div className="h-6 w-6 mr-2 rounded-full bg-primary/20 flex items-center justify-center">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="bg-background rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[75%] shadow-sm">
                <div className="flex items-center mb-3">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-72 mb-2" />
                <Skeleton className="h-4 w-52 mb-2" />
                <MessageLoading />
              </div>
            </div>
          </div>
        </div>

        {/* Chat input skeleton with improved styles */}
        <div className="mt-auto w-full justify-center self-center align-middle">
          <div className="mt-auto pt-4 self-center mx-auto border-t max-w-3xl border-border/40">
            <div className="flex items-center">
              <Skeleton className="h-20 w-full rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatInterface
      key={id}
      threadId={id}
      initialMessages={convertToUIMessages(messages) || []}
      searchQuery={searchQuery}
    />
  );
}
