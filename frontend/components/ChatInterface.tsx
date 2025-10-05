/**
 * ChatInterface Component
 *
 * Used in: frontend/routes/ChatHomePage.tsx, frontend/routes/ChatThreadPage.tsx
 * Purpose: Main chat interface that orchestrates the entire chat experience.
 * Manages chat state, message flow, API communication, and integrates all chat-related components.
 */

import { useChat } from "@ai-sdk/react";
import ChatMessageDisplay from "./ChatMessageDisplay";
import ChatInputField from "./ChatInputField";
import ChatMessageBrowser from "./ChatMessageBrowser";
import GuestWelcomeScreen from "./GuestWelcomeScreen";
import AuthLoadingScreen from "./auth/AuthLoadingScreen";
import { useChatMessageSummary } from "../hooks/useChatMessageSummary";
import { PlusIcon } from "./ui/icons/PlusIcon";

import { UIMessage } from "ai";

import { HybridDB, dbEvents } from "@/lib/hybridDB";
import type { FileAttachment } from "@/lib/appwriteDB";
import { streamingSync, StreamingState } from "@/lib/streamingSync";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { getModelConfig, AIModel } from "@/lib/models";
import { useSearchTypeStore } from "@/frontend/stores/SearchTypeStore";
import { useConversationStyleStore } from "@/frontend/stores/ConversationStyleStore";
import { useBYOKStore } from "@/frontend/stores/BYOKStore";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import ThemeToggleButton from "./ui/ThemeComponents";
import { Button } from "./ui/button";
import AuthDialog from "./auth/AuthDialog";
import ShareButton from "./ShareButton";
import { useAuthDialog } from "@/frontend/hooks/useAuthDialog";
import {
  MessageSquareMore,
  PanelLeftIcon,
  ArrowDown,
  Code,
  Search,
  BookOpen,
  FileQuestion,
  Compass,
  Sparkles,
  CircleHelp,
  X,
} from "lucide-react";
import { useChatMessageNavigator } from "@/frontend/hooks/useChatMessageNavigator";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useRef, useState, useEffect, useCallback, Fragment } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import GlobalSearchDialog from "./GlobalSearchDialog";
import { extractUrlsFromContent } from "./WebSearchCitations";
import WebSearchLoader from "./WebSearchLoader";
import RedditSearchLoader from "./RedditSearchLoader";
import { devLog, devWarn, devInfo, devError, prodError } from "@/lib/logger";
import { SearchIcon } from "./ui/icons/SearchIcon";
import { MessageCircleIcon } from "./ui/icons/MessageCircleIcon";
import { InfoIcon } from "./ui/icons/InfoIcon";
import { PanelLeft } from "@/frontend/components/ui/icons/panel-left";
import { AnimateIcon } from "@/frontend/components/ui/icons/icon";
import FreeTierShowcase from "./FreeTierShowcase";
import CapybaraIcon from "./ui/CapybaraIcon";

interface ChatInterfaceProps {
  threadId: string;
  initialMessages: UIMessage[];
  searchQuery?: string | null;
}

// Utility function to deduplicate messages at the React level
function deduplicateMessages<T extends { id: string; content: string }>(
  messages: T[]
): T[] {
  const seen = new Map<string, T>();

  messages.forEach((message, index) => {
    const existing = seen.get(message.id);

    if (!existing) {
      // New message - add it
      seen.set(message.id, message);
    } else {
      // Duplicate found - keep the one with more content or later in array
      if (
        message.content.length > existing.content.length ||
        (message.content.length === existing.content.length &&
          index > messages.findIndex((m) => m.id === existing.id))
      ) {
        seen.set(message.id, message);
        devWarn(
          "[ChatInterface] Replaced duplicate message in deduplication:",
          {
            id: message.id,
            existingContent: existing.content.substring(0, 50),
            newContent: message.content.substring(0, 50),
          }
        );
      }
    }
  });

  const deduplicated = Array.from(seen.values());

  if (deduplicated.length !== messages.length) {
    devWarn(
      `[ChatInterface] Deduplicated ${
        messages.length - deduplicated.length
      } duplicate messages from ${messages.length} total`
    );
  }

  return deduplicated;
}

// Define domain categories for suggested prompts with more specific questions

export default function ChatInterface({
  threadId,
  initialMessages,
  searchQuery,
}: ChatInterfaceProps) {
  const selectedModel = useModelStore((state) => state.selectedModel);
  const { selectedSearchType } = useSearchTypeStore();
  const { selectedStyle } = useConversationStyleStore();
  const { openRouterApiKey, tavilyApiKey } = useBYOKStore();
  const {
    user,
    isGuest,
    guestUser,
    loading: authLoading,
    incrementGuestMessages,
    canGuestSendMessage,
  } = useAuth();

  // Check for pending authentication state
  const [isPendingAuth, setIsPendingAuth] = useState(false);

  // Force clear pending auth when user is detected
  useEffect(() => {
    if (user && isPendingAuth) {
      devLog(
        "[ChatInterface] 🎉 User detected while pending auth - force clearing pending state"
      );
      setIsPendingAuth(false);
      sessionStorage.removeItem("cappychat_auth_pending");
    }
  }, [user, isPendingAuth]);

  useEffect(() => {
    const checkPendingAuth = () => {
      try {
        const pending = sessionStorage.getItem("cappychat_auth_pending");
        if (pending) {
          const parsed = JSON.parse(pending);
          const age = Date.now() - parsed.timestamp;
          // Check if pending auth is still valid (not older than 15 seconds - reduced from 30)
          const isValid = age < 15000;
          devLog("[ChatInterface] 🔍 Pending auth check:", {
            hasPending: true,
            isValid,
            method: parsed.method,
            age,
          });
          setIsPendingAuth(isValid);

          if (!isValid) {
            devLog(
              "[ChatInterface] 🧹 Clearing expired pending auth state (age:",
              age,
              "ms)"
            );
            sessionStorage.removeItem("cappychat_auth_pending");
          }
        } else {
          if (isPendingAuth) {
            devLog("[ChatInterface] 🧹 No pending auth found, clearing state");
          }
          setIsPendingAuth(false);
        }
      } catch (error) {
        devError("[ChatInterface] ❌ Error checking pending auth:", error);
        setIsPendingAuth(false);
      }
    };

    checkPendingAuth();

    // Check even more frequently for pending auth state changes (every 200ms)
    const interval = setInterval(checkPendingAuth, 200);

    // Listen for auth state changes to clear pending state
    const handleAuthStateChanged = () => {
      devLog("[ChatInterface] 🎉 Auth state changed - clearing pending state");
      setIsPendingAuth(false);
      sessionStorage.removeItem("cappychat_auth_pending");
    };

    // Emergency timeout to force clear pending state after 8 seconds
    const emergencyTimeout = setTimeout(() => {
      if (isPendingAuth) {
        devLog(
          "[ChatInterface] 🚨 EMERGENCY: Force clearing pending auth after 8 seconds"
        );
        setIsPendingAuth(false);
        sessionStorage.removeItem("cappychat_auth_pending");
      }
    }, 8000);

    window.addEventListener("authStateChanged", handleAuthStateChanged);

    return () => {
      clearInterval(interval);
      clearTimeout(emergencyTimeout);
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
    };
  }, [isPendingAuth]);
  const authDialog = useAuthDialog();
  const {
    sidebarWidth,
    toggleSidebar,
    state: sidebarState,
  } = useOutletContext<{
    sidebarWidth: number;
    toggleSidebar: () => void;
    state: "open" | "collapsed";
  }>();
  const isMobile = useIsMobile();
  const mainRef = useRef<HTMLElement>(null);

  // Hook for creating message summaries
  const { complete: createSummary } = useChatMessageSummary();
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [pendingAttachmentsForSubmit, setPendingAttachmentsForSubmit] =
    useState<FileAttachment[] | null>(null);
  const pendingUserMessageRef = useRef<UIMessage | null>(null);

  // State for model-specific retry
  const [retryModel, setRetryModel] = useState<AIModel | null>(null);
  const { setModel } = useModelStore();
  const isAutoScrollingRef = useRef(false);
  const chatInputSubmitRef = useRef<(() => void) | null>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const location = useLocation();
  const isHomePage = location.pathname === "/" || location.pathname === "/chat";

  // Track messages that were just added by append() to prevent real-time sync from overwriting them
  const recentlyAppendedMessages = useRef<Set<string>>(new Set());

  // Function to track when a message is appended
  const trackAppendedMessage = useCallback((messageId: string) => {
    devLog("[ChatInterface] Tracking appended message:", messageId);
    recentlyAppendedMessages.current.add(messageId);
    // Remove from tracking after 2 seconds to allow normal sync
    setTimeout(() => {
      recentlyAppendedMessages.current.delete(messageId);
      devLog("[ChatInterface] Stopped tracking appended message:", messageId);
    }, 2000);
  }, []);

  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  } = useChatMessageNavigator(mainRef);

  const {
    messages,
    input,
    status,
    setInput,
    setMessages,
    append,
    stop,
    reload,
    error,
  } = useChat({
    api:
      !isGuest && selectedSearchType !== "chat"
        ? selectedSearchType === "reddit"
          ? "/api/reddit-search"
          : selectedSearchType === "study"
          ? "/api/study-mode"
          : "/api/web-search"
        : "/api/chat-messaging",
    id: threadId,
    initialMessages,
    experimental_throttle: 0, // Zero throttle for instant real-time streaming
    onFinish: async (message) => {
      devLog("🏁 onFinish callback called for message:", message.id);

      // End streaming synchronization
      streamingSync.endStreaming(threadId, message.id, message.content);

      // Stop web search loading if it was active
      if (isWebSearching) {
        devLog("🔍 Stopping web search loading state");
        setIsWebSearching(false);
      }

      // Clear the pending user message ref (user message is now stored immediately in ChatInputField)
      if (pendingUserMessageRef.current) {
        devLog(
          "🧹 Clearing pending user message ref:",
          pendingUserMessageRef.current.id
        );
        pendingUserMessageRef.current = null;
      }

      // Skip database operations for guest users
      if (isGuest) {
        devLog("🚫 Skipping database operations for guest user");
        return;
      }

      // Save the AI message (useChat already handles adding it to the messages array)
      // We just need to persist it to the database using the actual message ID from useChat
      const modelUsed = retryModel || selectedModel;
      const aiMessage: UIMessage & {
        webSearchResults?: string[];
        webSearchImgs?: string[];
        model?: string;
      } = {
        id: message.id,
        parts: message.parts as UIMessage["parts"],
        role: "assistant",
        content: message.content,
        createdAt: new Date(),
        model: modelUsed, // Store the model used to generate this message
      };

      // Extract URLs from any assistant message content for citations
      devLog(
        "🔍 onFinish: Checking message content for URLs. Content length:",
        message.content.length
      );
      const extractedUrls = extractUrlsFromContent(message.content);
      devLog("🔍 onFinish: URLs found:", extractedUrls.length, extractedUrls);

      if (extractedUrls.length > 0) {
        devLog("✅ Extracted URLs from AI message:", message.id, extractedUrls);

        aiMessage.webSearchResults = extractedUrls;

        // Also update the message in the UI immediately
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((msg) =>
            msg.id === message.id
              ? ({ ...msg, webSearchResults: extractedUrls } as UIMessage & {
                  webSearchResults?: string[];
                })
              : msg
          );
          devLog("📱 Updated UI messages with extracted URLs");
          return deduplicateMessages(updatedMessages);
        });
      }

      // Extract image URLs from hidden marker and persist
      const extractImagesFromContent = (c: string): string[] =>
        c.match(/<!-- SEARCH_IMAGES: (.*?) -->/)
          ? (c.match(/<!-- SEARCH_IMAGES: (.*?) -->/) as RegExpMatchArray)[1]
              .split("|")
              .filter(Boolean)
              .slice(0, 15)
          : [];

      const extractedImgs = extractImagesFromContent(message.content);
      if (extractedImgs.length > 0) {
        aiMessage.webSearchImgs = extractedImgs;
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === message.id
              ? ({ ...m, webSearchImgs: extractedImgs } as UIMessage & {
                  webSearchImgs?: string[];
                })
              : m
          );
          return deduplicateMessages(updated);
        });
      }

      // Clear prefetched streaming images once final images (if any) are applied
      setStreamingWebImgs(null);

      // Reset the web search flag if it was set
      if (nextResponseNeedsWebSearch.current) {
        nextResponseNeedsWebSearch.current = false;
      }

      // Skip database operations for guest users
      if (!isGuest) {
        HybridDB.createMessage(threadId, aiMessage);

        // Create summary for assistant message
        createSummary(message.content, {
          body: {
            messageId: message.id,
            threadId: threadId,
          },
        });
      }

      // Scroll to bottom when new message comes in
      scrollToBottom();
    },
    onError: (error) => {
      devError("❌ Chat error:", error);
      // Stop web search loading on error
      if (isWebSearching) {
        devLog("🔍 Stopping web search loading due to error");
        setIsWebSearching(false);
      }
    },

    headers: {},
    body: {
      model: retryModel || selectedModel,
      conversationStyle: selectedStyle,
      userApiKey: openRouterApiKey,
      userTavilyApiKey: tavilyApiKey,
      userId: user?.$id,
      threadId: threadId,
      isGuest: isGuest,
    },
  });

  // Effect to handle selected prompt
  useEffect(() => {
    if (selectedPrompt) {
      setInput(selectedPrompt);
      setSelectedPrompt("");
    }
  }, [selectedPrompt, setInput]);

  // Auto-submit pending input handed off during new-chat navigation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cappychat_pending_input");
      if (!raw) return;
      const pending = JSON.parse(raw) as {
        threadId: string;
        input?: string;
        attachments?: Array<
          Omit<FileAttachment, "createdAt"> & { createdAt?: string }
        >;
      };
      if (pending.threadId !== threadId) return;
      if (messages.length > 0) {
        sessionStorage.removeItem("cappychat_pending_input");
        return;
      }
      const normalizedAttachments = Array.isArray(pending.attachments)
        ? (pending.attachments
            .map((attachment) => {
              if (!attachment) return null;
              const createdAt = attachment.createdAt
                ? new Date(attachment.createdAt)
                : new Date();
              return {
                ...attachment,
                createdAt,
              } as FileAttachment;
            })
            .filter(Boolean) as FileAttachment[])
        : [];

      const hasInput = pending.input && pending.input.trim().length > 0;
      const hasAttachments = normalizedAttachments.length > 0;

      if (hasAttachments) {
        setPendingAttachmentsForSubmit(normalizedAttachments);
      } else {
        setPendingAttachmentsForSubmit(null);
      }

      if (hasInput || hasAttachments) {
        setInput(pending.input ?? "");
        sessionStorage.removeItem("cappychat_pending_input");

        // Wait until ChatInputField registers submitRef
        let attempts = 0;
        const maxAttempts = 30; // ~3s
        const trySubmit = () => {
          if (chatInputSubmitRef.current) {
            chatInputSubmitRef.current();
          } else if (attempts++ < maxAttempts) {
            setTimeout(trySubmit, 100);
          }
        };
        setTimeout(trySubmit, 100);
      }
    } catch {}
    // Only run on mount/when threadId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Effect to handle search query from URL parameter - only run once
  useEffect(() => {
    if (searchQuery && searchQuery.trim() && messages.length === 0) {
      devLog("🔍 Search query detected:", searchQuery);
      setInput(searchQuery);

      // Auto-submit the search query through ChatInputField's submit function
      const timer = setTimeout(() => {
        if (chatInputSubmitRef.current) {
          devLog(
            "🚀 Auto-submitting search query through ChatInputField:",
            searchQuery
          );
          chatInputSubmitRef.current();
        } else {
          devLog("⚠️ chatInputSubmitRef.current is not available yet");
        }
      }, 500); // Increased timeout to ensure components are fully loaded

      return () => clearTimeout(timer);
    }
  }, [searchQuery, setInput, messages.length]); // Added messages.length to dependencies

  // Simple scroll detection - track if user manually scrolled up
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      // Skip if we're auto-scrolling
      if (isAutoScrollingRef.current) {
        return;
      }

      const { scrollHeight, scrollTop, clientHeight } = mainElement;
      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 50;

      setShowScrollToBottom(!isAtBottom);

      // If user scrolled up manually, mark it
      if (!isAtBottom) {
        setUserHasScrolledUp(true);
      } else {
        // User is back at bottom, reset the flag
        setUserHasScrolledUp(false);
      }
    };

    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  // Force scroll to bottom during streaming - this runs on every message content change
  useEffect(() => {
    if (status === "streaming" && !userHasScrolledUp && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // Force immediate scroll to bottom during streaming
        if (mainRef.current) {
          mainRef.current.scrollTop = mainRef.current.scrollHeight;
        }
      }
    }
  }, [messages, status, userHasScrolledUp]);

  // Auto-scroll when new messages arrive (not during streaming)
  useEffect(() => {
    if (status !== "streaming" && messages.length > 0 && !userHasScrolledUp) {
      scrollToBottom();
    }
  }, [messages.length, status, userHasScrolledUp]);

  // Reset user scroll flag when streaming starts (so it sticks to bottom by default)
  useEffect(() => {
    if (status === "streaming") {
      setUserHasScrolledUp(false);
    }
  }, [status]);

  // Continuous scroll during streaming - more aggressive approach
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (status === "streaming" && !userHasScrolledUp) {
      intervalId = setInterval(() => {
        if (mainRef.current && !userHasScrolledUp) {
          mainRef.current.scrollTop = mainRef.current.scrollHeight;
        }
      }, 50); // Scroll every 50ms during streaming
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, userHasScrolledUp]);

  // Track streaming status and sync across sessions
  const lastStreamingMessageRef = useRef<{
    id: string;
    content: string;
    lastLength: number;
  } | null>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "streaming" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        // Check if this is a new streaming message or content update
        const isNewMessage =
          !lastStreamingMessageRef.current ||
          lastStreamingMessageRef.current.id !== lastMessage.id;
        const isContentUpdate =
          lastStreamingMessageRef.current &&
          (lastStreamingMessageRef.current.content !== lastMessage.content ||
            lastStreamingMessageRef.current.lastLength !==
              lastMessage.content.length);

        if (isNewMessage) {
          // Start streaming sync for new message
          streamingSync.startStreaming(threadId, lastMessage.id);
          devLog(
            "[ChatInterface] Started streaming sync for message:",
            lastMessage.id
          );

          // Start interval to continuously sync streaming content
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
          }

          streamingIntervalRef.current = setInterval(() => {
            const currentLastMessage = messages[messages.length - 1];
            if (
              currentLastMessage &&
              currentLastMessage.role === "assistant" &&
              currentLastMessage.id === lastMessage.id
            ) {
              streamingSync.updateStreamingContent(
                threadId,
                currentLastMessage.id,
                currentLastMessage.content
              );
            }
          }, 100); // Update every 100ms during streaming
        }

        if (isNewMessage || isContentUpdate) {
          // Update streaming content in real-time
          streamingSync.updateStreamingContent(
            threadId,
            lastMessage.id,
            lastMessage.content
          );
          devLog(
            "[ChatInterface] Updated streaming content:",
            lastMessage.content.length,
            "chars"
          );

          // Extract URLs from streaming content for web search citations
          // Check for URLs in any assistant message, not just when web search is explicitly enabled
          if (lastMessage.content) {
            const extractedUrls = extractUrlsFromContent(lastMessage.content);
            devLog(
              "🔍 Checking for URLs in streaming content. Content length:",
              lastMessage.content.length,
              "URLs found:",
              extractedUrls.length
            );
            if (extractedUrls.length > 0) {
              devLog(
                "🔍 Extracted URLs from streaming content:",
                extractedUrls
              );

              // Update the message with extracted URLs in real-time
              setMessages((prevMessages) => {
                const updatedMessages = prevMessages.map((msg) =>
                  msg.id === lastMessage.id
                    ? ({
                        ...msg,
                        webSearchResults: extractedUrls,
                      } as UIMessage & {
                        webSearchResults?: string[];
                      })
                    : msg
                );
                return deduplicateMessages(updatedMessages);
              });
            }
          }
        }

        // Update reference
        lastStreamingMessageRef.current = {
          id: lastMessage.id,
          content: lastMessage.content,
          lastLength: lastMessage.content.length,
        };
      }
    } else if (status !== "streaming" && lastStreamingMessageRef.current) {
      // Streaming ended, clean up
      const lastRef = lastStreamingMessageRef.current;
      streamingSync.endStreaming(threadId, lastRef.id, lastRef.content);
      devLog("[ChatInterface] Ended streaming sync for message:", lastRef.id);
      lastStreamingMessageRef.current = null;

      // Clear interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    }
  }, [status, messages, threadId]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  // Real-time message synchronization (skip for guest users)
  useEffect(() => {
    // Skip real-time sync for guest users
    if (isGuest) {
      devLog("[ChatInterface] Skipping real-time sync for guest user");
      return;
    }

    devLog(
      "[ChatInterface] Setting up real-time message sync for thread:",
      threadId
    );

    const handleMessagesUpdated = (
      updatedThreadId: string,
      updatedMessages: any[]
    ) => {
      devLog(
        "[ChatInterface] Real-time messages updated for thread:",
        updatedThreadId,
        "Current thread:",
        threadId
      );

      if (updatedThreadId === threadId) {
        devLog(
          "[ChatInterface] Updating messages in UI. Count:",
          updatedMessages.length,
          "Current UI messages:",
          messages.length
        );

        // Convert DB messages to UI messages format
        const uiMessages: UIMessage[] = updatedMessages.map(
          (msg) =>
            ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: msg.parts || [{ type: "text", text: msg.content }],
              createdAt: msg.createdAt,
              webSearchResults: msg.webSearchResults,
              webSearchImgs: (msg as any).webSearchImgs,
              attachments: msg.attachments,
              model: msg.model,
              imgurl: msg.imgurl,
            } as any)
        );

        // Smart merge: Preserve messages that were recently added by append()
        // and only add new messages from the database
        const currentMessageIds = new Set(messages.map((msg) => msg.id));
        const dbMessageIds = new Set(uiMessages.map((msg) => msg.id));

        // Check if there are new messages in the database that aren't in the UI
        const hasNewMessages = uiMessages.some(
          (dbMsg) =>
            !currentMessageIds.has(dbMsg.id) &&
            !recentlyAppendedMessages.current.has(dbMsg.id)
        );

        // Check if there are messages in UI that aren't in database (shouldn't happen but safety check)
        const hasMissingMessages = messages.some(
          (uiMsg) =>
            !dbMessageIds.has(uiMsg.id) &&
            !recentlyAppendedMessages.current.has(uiMsg.id)
        );

        // Check if there are existing messages that need updates (e.g., image generation completed)
        const hasUpdatedMessages = uiMessages.some((dbMsg) => {
          const currentMsg = messages.find((msg) => msg.id === dbMsg.id);
          if (!currentMsg) return false;

          // Check for image generation updates (loading -> completed)
          const wasLoading =
            currentMsg.content?.includes("Generating your image") ||
            (currentMsg as any).isImageGenerationLoading;
          const nowHasImage =
            (dbMsg as any).imgurl &&
            !dbMsg.content?.includes("Generating your image");

          // Check for any content or imgurl differences
          const contentChanged = currentMsg.content !== dbMsg.content;
          const imgUrlChanged =
            (currentMsg as any).imgurl !== (dbMsg as any).imgurl;

          return (wasLoading && nowHasImage) || contentChanged || imgUrlChanged;
        });

        if (hasNewMessages || hasMissingMessages || hasUpdatedMessages) {
          devLog("[ChatInterface] Smart merge: Changes detected", {
            hasNewMessages,
            hasMissingMessages,
            hasUpdatedMessages,
            currentCount: messages.length,
            dbCount: uiMessages.length,
          });

          // For image generation updates, we need to replace existing messages with updated DB versions
          if (hasUpdatedMessages) {
            devLog("[ChatInterface] Handling image generation message updates");

            // Build a map of DB messages by ID for quick lookup
            const dbMessageMap = new Map(
              uiMessages.map((msg) => [msg.id, msg])
            );

            // Update existing messages with DB versions, keeping UI messages that aren't in DB
            const updatedMessages = messages.map((uiMsg) => {
              const dbMsg = dbMessageMap.get(uiMsg.id);
              if (dbMsg) {
                // Check if this was an image generation update
                const wasLoading =
                  uiMsg.content?.includes("Generating your image") ||
                  (uiMsg as any).isImageGenerationLoading;
                const nowHasImage =
                  (dbMsg as any).imgurl &&
                  !dbMsg.content?.includes("Generating your image");

                if (wasLoading && nowHasImage) {
                  devLog(
                    "[ChatInterface] Updating image generation message:",
                    uiMsg.id
                  );
                }

                return dbMsg; // Use the updated DB version
              }
              return uiMsg; // Keep the UI version if no DB match
            });

            // Add any new messages from DB that aren't in UI
            uiMessages.forEach((dbMsg) => {
              if (
                !currentMessageIds.has(dbMsg.id) &&
                !recentlyAppendedMessages.current.has(dbMsg.id)
              ) {
                updatedMessages.push(dbMsg);
              }
            });

            // Sort by creation date to maintain order
            updatedMessages.sort((a, b) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return aTime - bTime;
            });

            setMessages(deduplicateMessages(updatedMessages));
          } else {
            // Regular merge for new messages
            const mergedMessages = [...messages];

            // Add new messages from database that aren't already in UI
            uiMessages.forEach((dbMsg) => {
              if (
                !currentMessageIds.has(dbMsg.id) &&
                !recentlyAppendedMessages.current.has(dbMsg.id)
              ) {
                mergedMessages.push(dbMsg);
              }
            });

            // Sort by creation date to maintain order
            mergedMessages.sort((a, b) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return aTime - bTime;
            });

            setMessages(deduplicateMessages(mergedMessages));
          }

          // Auto-scroll to bottom for new messages unless user scrolled up
          if (!userHasScrolledUp) {
            setTimeout(() => scrollToBottom(), 30);
          }
        }
      }
    };

    // Listen for real-time message updates
    dbEvents.on("messages_updated", handleMessagesUpdated);

    return () => {
      dbEvents.off("messages_updated", handleMessagesUpdated);
    };
  }, [threadId, messages, setMessages, isGuest]);

  // Real-time streaming synchronization
  useEffect(() => {
    // Listen for streaming broadcasts from other sessions
    const handleStreamingBroadcast = (
      broadcastThreadId: string,
      messageId: string,
      streamingState: StreamingState
    ) => {
      devLog(
        "[ChatInterface] Streaming broadcast received:",
        messageId,
        "chars:",
        streamingState.content.length,
        "from session:",
        streamingState.sessionId
      );

      // Only apply if it's for this thread and from another session
      if (
        broadcastThreadId === threadId &&
        streamingState.sessionId !== streamingSync.getSessionId()
      ) {
        devLog(
          "[ChatInterface] Applying streaming update from another session"
        );

        if (streamingState.isStreaming) {
          // Update the streaming message in real-time from other sessions
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((msg) =>
              msg.id === streamingState.messageId
                ? { ...msg, content: streamingState.content }
                : msg
            );

            // If message doesn't exist yet, add it
            const messageExists = prevMessages.some(
              (msg) => msg.id === streamingState.messageId
            );
            if (!messageExists) {
              updatedMessages.push({
                id: streamingState.messageId,
                role: "assistant",
                content: streamingState.content,
                parts: [{ type: "text", text: streamingState.content }],
                createdAt: new Date(),
              });
            }

            return deduplicateMessages(updatedMessages);
          });

          // Auto-scroll during streaming with minimal delay unless user scrolled up
          if (!userHasScrolledUp) {
            setTimeout(() => scrollToBottom(), 5);
          }
        }
      }
    };

    // Subscribe to streaming broadcasts
    dbEvents.on("streaming_broadcast", handleStreamingBroadcast);

    return () => {
      devLog(
        "[ChatInterface] Cleaning up streaming sync for thread:",
        threadId
      );
      dbEvents.off("streaming_broadcast", handleStreamingBroadcast);
    };
  }, [threadId, setMessages]);

  // Track when web search is enabled for the next assistant response
  const nextResponseNeedsWebSearch = useRef<boolean>(false);
  const [isWebSearching, setIsWebSearching] = useState<boolean>(false);
  const [webSearchQuery, setWebSearchQuery] = useState<string>("");
  // Prefetched images to show immediately while streaming starts
  const [streamingWebImgs, setStreamingWebImgs] = useState<string[] | null>(
    null
  );

  // Track when streaming actually starts with content
  const streamingStartTimeRef = useRef<number | null>(null);

  // Effect to stop web search loading when actual content starts streaming
  // Keep loader visible during tool execution (minimum 1 second, or until content appears)
  useEffect(() => {
    if (status === "streaming" && isWebSearching) {
      // Record when streaming started
      if (streamingStartTimeRef.current === null) {
        streamingStartTimeRef.current = Date.now();
        devLog("🔍 Streaming started, keeping loader visible during tool execution");
      }

      // Check if the last message has actual content (not just empty or tool calls)
      const lastMessage = messages[messages.length - 1];
      const hasContent = lastMessage &&
                        lastMessage.role === "assistant" &&
                        lastMessage.content &&
                        lastMessage.content.trim().length > 10; // At least 10 chars to avoid empty/whitespace

      // Keep loader visible for at least 500ms to avoid flashing
      const minDisplayTime = 500;
      const elapsedTime = Date.now() - (streamingStartTimeRef.current || 0);

      if (hasContent && elapsedTime >= minDisplayTime) {
        devLog("🔍 Stopping web search loading - actual content received");
        setIsWebSearching(false);
        streamingStartTimeRef.current = null;
      }
    } else if (status !== "streaming") {
      // Reset timer when not streaming
      streamingStartTimeRef.current = null;
    }
  }, [status, isWebSearching, messages]);

  // Callback to track when a message is sent with search enabled
  const handleWebSearchMessage = useCallback(
    (messageId: string, searchQuery?: string) => {
      nextResponseNeedsWebSearch.current = true;
      if (selectedSearchType !== "chat") {
        setIsWebSearching(true);
        // Use the provided search query or fallback to getting from messages
        const q = (() => {
          if (searchQuery) return searchQuery;
          const lastUserMessage = messages
            .filter((msg) => msg.role === "user")
            .pop();
          return lastUserMessage?.content || "";
        })();
        setWebSearchQuery(q || "search query");

        // Disable prefetch - images will come from tool results in the response
        // Prefetching causes confusion when tools like weather don't return images
      }
    },
    [selectedSearchType, messages]
  );

  // Handle image generation retry
  const handleImageGenerationRetry = useCallback(
    async (
      prompt: string,
      model: AIModel,
      attachments: any[],
      originalMessage?: UIMessage
    ) => {
      // Create a loading message
      const loadingMessageId = uuidv4();

      try {
        devLog("🎨 Starting image generation retry with model:", model);

        const loadingMessage: UIMessage = {
          id: loadingMessageId,
          role: "assistant",
          content: `🎨 Generating your image [aspectRatio:1:1]`,
          parts: [
            {
              type: "text",
              text: `🎨 Generating your image [aspectRatio:1:1]`,
            },
          ],
          createdAt: new Date(),
        };

        // Add loading message to UI
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== originalMessage?.id);
          return [...filtered, loadingMessage];
        });

        // Call image generation API
        const response = await fetch("/api/image-generation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            model: model,
            userId: isGuest ? null : user?.$id,
            isGuest: isGuest,
            width: 1024,
            height: 1024,
            attachments: attachments,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate image");
        }

        const result = await response.json();
        devLog("✅ Image generation retry completed:", result);

        // Update the loading message with the result
        setMessages((prev) => {
          return prev.map((m) => {
            if (m.id === loadingMessageId) {
              return {
                ...m,
                content: `[aspectRatio:1:1]`,
                parts: [{ type: "text", text: `[aspectRatio:1:1]` }],
                imgurl: result.imageUrl,
                model: result.model,
                isImageGenerationLoading: false,
                isImageGeneration: true,
                aspectRatio: "1:1",
              } as UIMessage;
            }
            return m;
          });
        });

        // Save to database if not guest
        if (!isGuest) {
          const finalMessage: UIMessage & { imgurl?: string; model?: string } =
            {
              id: loadingMessageId,
              role: "assistant",
              content: `[aspectRatio:1:1]`,
              parts: [{ type: "text", text: `[aspectRatio:1:1]` }],
              createdAt: new Date(),
              imgurl: result.imageUrl,
              model: result.model,
            };

          HybridDB.createMessage(threadId, finalMessage);
        }
      } catch (error) {
        devError("Error in image generation retry:", error);

        // Update loading message with error
        setMessages((prev) => {
          return prev.map((m) => {
            if (m.id === loadingMessageId) {
              return {
                ...m,
                content: `❌ Failed to generate image: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
                parts: [
                  {
                    type: "text",
                    text: `❌ Failed to generate image: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`,
                  },
                ],
                isImageGenerationLoading: false,
              } as UIMessage;
            }
            return m;
          });
        });
      }
    },
    [user, isGuest, threadId, setMessages]
  );

  // Handle retry with specific model
  const handleRetryWithModel = useCallback(
    async (model?: AIModel, message?: UIMessage) => {
      // Stop the current request
      stop();

      // Set the retry model temporarily
      setRetryModel(model || null);

      // Determine if this is an image generation retry
      const isImageGenerationRetry =
        message &&
        ((message as any).isImageGeneration ||
          (message as any).isImageGenerationLoading ||
          !!(message as any).imgurl ||
          (message.content &&
            (message.content.includes("🎨 Generating your image") ||
              message.content.includes("Generating your image"))) ||
          ((message as any).model &&
            getModelConfig((message as any).model as AIModel)
              ?.isImageGeneration));

      devLog("🔄 Retry context:", {
        isImageGenerationRetry,
        message: message?.content,
        model: (message as any)?.model,
      });

      // If we have message information, handle proper deletion
      if (message) {
        if (message.role === "user") {
          await HybridDB.deleteTrailingMessages(
            threadId,
            message.createdAt as Date,
            false
          );

          setMessages((messages) => {
            const index = messages.findIndex((m) => m.id === message.id);
            if (index !== -1) {
              const slicedMessages = [...messages.slice(0, index + 1)];
              return deduplicateMessages(slicedMessages);
            }
            return deduplicateMessages(messages);
          });
        } else {
          await HybridDB.deleteTrailingMessages(
            threadId,
            message.createdAt as Date
          );

          setMessages((messages) => {
            const index = messages.findIndex((m) => m.id === message.id);
            if (index !== -1) {
              const slicedMessages = [...messages.slice(0, index)];
              return deduplicateMessages(slicedMessages);
            }
            return deduplicateMessages(messages);
          });
        }
      }

      // Handle image generation retry differently
      if (isImageGenerationRetry) {
        devLog("🎨 Handling image generation retry");

        // Find the user message that triggered this image generation
        let userPrompt = "";
        let userAttachments: any[] = [];

        if (message?.role === "assistant") {
          // Find the preceding user message
          const messageIndex = messages.findIndex((m) => m.id === message.id);
          if (messageIndex > 0) {
            const userMessage = messages[messageIndex - 1];
            if (userMessage.role === "user") {
              userPrompt = userMessage.content;
              userAttachments = (userMessage as any).attachments || [];
            }
          }
        } else if (message?.role === "user") {
          userPrompt = message.content;
          userAttachments = (message as any).attachments || [];
        }

        if (!userPrompt) {
          devError("Could not find user prompt for image generation retry");
          return;
        }

        devLog("🎨 Retrying image generation with prompt:", userPrompt);

        // Call image generation API directly
        handleImageGenerationRetry(
          userPrompt,
          model || selectedModel,
          userAttachments,
          message
        );
        return;
      }

      // For text generation, use the normal reload flow
      setTimeout(() => {
        reload();
        // Reset retry model after reload
        setTimeout(() => setRetryModel(null), 100);
      }, 0);
    },
    [selectedModel, reload, stop, setMessages, threadId]
  );

  // Click handler for Suggested Questions: submit immediately as a new user message
  const handleSuggestedQuestionClick = useCallback(
    (question: string) => {
      append({ role: "user", content: question });
    },
    [append]
  );

  // This useEffect is no longer needed since we handle web search results in onFinish
  // Keeping it commented for reference
  // useEffect(() => {
  //   // Web search results are now handled in the onFinish callback
  // }, []);

  // Force scrollbar visibility and ensure proper initialization
  useEffect(() => {
    if (mainRef.current) {
      const element = mainRef.current;
      // Force a reflow to ensure scrollbar is properly rendered
      const originalOverflow = element.style.overflow;
      element.style.overflow = "hidden";

      requestAnimationFrame(() => {
        element.style.overflow = originalOverflow || "auto";
        element.style.overflowX = "hidden";
        element.style.overflowY = "scroll";

        // Force a repaint to ensure scrollbar appears
        element.offsetHeight;
      });
    }
  }, [messages.length, status, threadId]);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!hasMessages && mainRef.current) {
      isAutoScrollingRef.current = true;
      mainRef.current.scrollTop = 0;

      requestAnimationFrame(() => {
        isAutoScrollingRef.current = false;
      });

      setShowScrollToBottom(false);
      setUserHasScrolledUp(false);
    }
  }, [hasMessages]);

  const scrollToBottom = () => {
    if (!hasMessages) {
      if (mainRef.current) {
        isAutoScrollingRef.current = true;
        mainRef.current.scrollTop = 0;
        requestAnimationFrame(() => {
          isAutoScrollingRef.current = false;
        });
      }
      setShowScrollToBottom(false);
      setUserHasScrolledUp(false);
      return;
    }

    if (mainRef.current) {
      // Set flag to prevent scroll event from triggering during auto-scroll
      isAutoScrollingRef.current = true;

      mainRef.current.scrollTo({
        top: mainRef.current.scrollHeight,
        behavior: "smooth",
      });

      // Reset flag after scroll completes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 100);
    }
    setShowScrollToBottom(false);
    // Reset user scroll flag when manually scrolling to bottom
    setUserHasScrolledUp(false);
  };

  const sidebarOpen = localStorage.getItem("sidebarOpen") === "true";

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId === selectedDomain ? null : domainId);
  };

  const { state } = useOutletContext<{
    state: "open" | "collapsed";
  }>();

  return (
    <div
      className={cn(
        "relative w-full h-screen border-primary/30 flex flex-col bg-background dark:bg-card   ",
        state === "open"
          ? "mt-5 border-t-[1px] border-l-[1px] rounded-tl-xl"
          : ""
      )}
    >
      <AppPanelTrigger />
      <QuickShortCutInfo />

      <main
        ref={mainRef}
        className="flex-1 overflow-y-scroll relative overflow-x-hidden pt-20 md:pt-8 pb-40 main-chat-scrollbar"
        style={{
          scrollbarGutter: "stable",
        }}
      >
        {isHomePage && messages.length === 0 ? (
          (() => {
            const shouldShowLoading = authLoading || isPendingAuth;
            devLog("[ChatInterface] 🎭 Render decision:", {
              authLoading,
              isPendingAuth,
              isGuest,
              user: !!user,
              shouldShowLoading,
            });

            if (shouldShowLoading) {
              return (
                <div className="flex items-center justify-center h-full">
                  <AuthLoadingScreen
                    type="callback"
                    message={
                      isPendingAuth
                        ? "Completing authentication..."
                        : "Setting up your workspace..."
                    }
                  />
                </div>
              );
            } else if (isGuest) {
              return (
                <GuestWelcomeScreen
                  onSignUp={() => authDialog.navigateToSignup()}
                  onLogin={() => authDialog.navigateToLogin()}
                  // Add chat input props for guest messaging
                  threadId={threadId}
                  input={input}
                  status={status}
                  setInput={setInput}
                  append={append}
                  setMessages={setMessages}
                  stop={stop}
                  pendingUserMessageRef={pendingUserMessageRef}
                  onWebSearchMessage={handleWebSearchMessage}
                  submitRef={chatInputSubmitRef}
                  messages={messages}
                  onMessageAppended={trackAppendedMessage}
                />
              );
            } else {
              return (
                <WelcomeScreen
                  onPromptSelect={handlePromptClick}
                  isDarkTheme={isDarkTheme}
                  selectedDomain={selectedDomain}
                  onDomainSelect={handleDomainSelect}
                  threadId={threadId}
                  input={input}
                  status={status}
                  setInput={setInput}
                  append={append}
                  setMessages={setMessages}
                  stop={stop}
                  pendingUserMessageRef={pendingUserMessageRef}
                  onWebSearchMessage={handleWebSearchMessage}
                  submitRef={chatInputSubmitRef}
                  messages={messages}
                  onMessageAppended={trackAppendedMessage}
                />
              );
            }
          })()
        ) : messages.length === 0 ? (
          // Empty thread page: show centered input so the user can start
          <div className="mx-auto flex justify-center px-4 py-6">
            <div className="w-full max-w-3xl">
              <ChatInputField
                threadId={threadId}
                input={input}
                status={status}
                append={append}
                setMessages={setMessages}
                setInput={setInput}
                stop={stop}
                pendingUserMessageRef={pendingUserMessageRef}
                onWebSearchMessage={handleWebSearchMessage}
                submitRef={chatInputSubmitRef}
                messages={messages}
                onMessageAppended={trackAppendedMessage}
                pendingAttachments={pendingAttachmentsForSubmit}
                onPendingAttachmentsConsumed={() =>
                  setPendingAttachmentsForSubmit(null)
                }
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex justify-center px-4 py-6">
            <ChatMessageDisplay
              threadId={threadId}
              messages={messages}
              status={status}
              setMessages={setMessages}
              reload={reload}
              error={error}
              registerRef={registerRef}
              stop={stop}
              onRetryWithModel={handleRetryWithModel}
              isWebSearching={isWebSearching}
              webSearchQuery={webSearchQuery}
              selectedSearchType={selectedSearchType}
              onSuggestedQuestionClick={handleSuggestedQuestionClick}
              streamingWebImgs={streamingWebImgs || undefined}
            />
          </div>
        )}
      </main>

      <div className="fixed hidden md:block top-0 left-0 right-0 z-50">
        <div
          className="relative"
          style={{
            width: isMobile
              ? "100%"
              : sidebarState === "open"
              ? `calc(100% - ${sidebarWidth}px)`
              : "100%",
            marginLeft: isMobile
              ? 0
              : sidebarState === "open"
              ? `${sidebarWidth}px`
              : 0,
          }}
        >
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-3 ${
              state === "open" ? "top-5" : "top-3"
            }`}
          >
            <FreeTierShowcase />
          </div>
        </div>
      </div>

      {/* Fixed Input Container with Dynamic Width */}
      <div className="fixed bottom-5 left-0 right-0 z-20">
        {/* Scroll to bottom button - only show when there are messages and not on guest welcome screen */}
        {messages.length > 0 && !isGuest && (
          <div
            className={cn(
              "relative transition-opacity duration-300",
              showScrollToBottom
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            )}
            style={{
              width: isMobile
                ? "100%"
                : sidebarState === "open"
                ? `calc(100% - ${sidebarWidth}px)`
                : "100%",
              marginLeft: isMobile
                ? 0
                : sidebarState === "open"
                ? `${sidebarWidth}px`
                : 0,
            }}
          >
            <Button
              onClick={scrollToBottom}
              variant="secondary"
              size="sm"
              className={cn(
                "rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 shadow-lg text-primary-foreground mb-2 transition-all duration-200",
                isDarkTheme
                  ? "bg-primary/90 hover:bg-primary"
                  : "bg-primary hover:bg-primary/90"
              )}
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="h-4 w-4 md:mr-1" />
              <span className="text-xs hidden md:block">Latest messages</span>
            </Button>
          </div>
        )}

        {/* Bottom chat input: show on thread pages always, and on home when messages exist */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "flex justify-center px-4",
              isMobile
                ? "w-full"
                : sidebarState === "open"
                ? "ml-auto"
                : "w-full"
            )}
            style={{
              width: isMobile
                ? "100%"
                : sidebarState === "open"
                ? `calc(100% - ${sidebarWidth}px)`
                : "100%",
              marginLeft: isMobile
                ? 0
                : sidebarState === "open"
                ? `${sidebarWidth}px`
                : 0,
            }}
          >
            <div className="w-full max-w-3xl">
              <ChatInputField
                threadId={threadId}
                input={input}
                status={status}
                append={append}
                setMessages={setMessages}
                setInput={setInput}
                stop={stop}
                pendingUserMessageRef={pendingUserMessageRef}
                onWebSearchMessage={handleWebSearchMessage}
                submitRef={chatInputSubmitRef}
                messages={messages}
                onMessageAppended={trackAppendedMessage}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed action buttons */}
      <div
        className={cn(
          "fixed z-20",
          state === "open" ? " top-5 right-0" : "top-3 right-0"
        )}
      >
        <div
          className={cn(
            "flex gap-2 bg-background ml-3  px-2 ",
            state === "open"
              ? "border-l-[1px] pr-3 border-b-[1px] pb-2 rounded-bl-md border-primary/30"
              : "border-none mr-6 rounded-md py-2"
          )}
        >
          <ShareButton
            threadId={threadId}
            variant={isDarkTheme ? "outline" : "secondary"}
            className="text-primary"
          />

          <Button
            onClick={handleToggleNavigator}
            variant={isDarkTheme ? "outline" : "secondary"}
            size="icon"
            className={cn(
              "focus:outline-none focus:ring-0 shadow-sm rounded-md "
            )}
            aria-label={
              isNavigatorVisible
                ? "Hide message browser"
                : "Show message browser"
            }
          >
            <MessageCircleIcon className="h-5 w-5 text-primary" />
          </Button>

          <ThemeToggleButton variant="inline" />
        </div>
      </div>

      <ChatMessageBrowser
        threadId={threadId}
        scrollToMessage={scrollToMessage}
        isVisible={isNavigatorVisible}
        onClose={closeNavigator}
      />

      {/* Auth Dialog for guest users */}
      <AuthDialog
        isOpen={authDialog.isOpen}
        onClose={authDialog.closeDialog}
        initialMode={authDialog.mode}
        title={authDialog.title}
        description={authDialog.description}
      />
    </div>
  );
}

////////////////////////////////////////////////////
/////////////////Left Side Panel Trigger////////////
////////////////////////////////////////////////////

const AppPanelTrigger = () => {
  const { sidebarWidth, toggleSidebar, state, isMobile } = useOutletContext<{
    sidebarWidth: number;
    toggleSidebar: () => void;
    state: "open" | "collapsed";
    isMobile: boolean;
  }>();

  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const sidebarOpen = localStorage.getItem("sidebarOpen") === "true";

  // Enhanced toggle function for debugging
  const handleToggle = () => {
    devLog("Panel trigger clicked, current state:", state);
    toggleSidebar();
  };

  const navigate = useNavigate();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const handleOpenSearch = useCallback(() => {
    setIsSearchDialogOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchDialogOpen(false);
  }, []);

  // Show trigger on mobile or when sidebar is collapsed on desktop
  return (
    <div
      className={`fixed left-2 flex top-3 z-50 ${
        state === "collapsed"
          ? "top-3 bg-background p-1.5 mr-6 ml-3 rounded-md"
          : "bg-background"
      }`}
    >
      <AnimateIcon animateOnHover>
        <Button
          size="icon"
          variant={isDarkTheme ? "outline" : "secondary"}
          onClick={handleToggle}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className={"text-primary"} />
        </Button>
      </AnimateIcon>

      <div className="rounded-md md:block">
        <Button
          onClick={handleOpenSearch}
          size="icon"
          variant={isDarkTheme ? "outline" : "secondary"}
          className={` ${state === "collapsed" ? "ml-2" : "hidden"}`}
        >
          <SearchIcon className="text-primary" />
        </Button>
        <GlobalSearchDialog
          isOpen={isSearchDialogOpen}
          onClose={handleCloseSearch}
        />
      </div>

      <div className="rounded-md">
        <Button
          onClick={() => {
            if (location.pathname !== "/chat") navigate("/chat");
          }}
          disabled={location.pathname === "/chat"}
          size="icon"
          variant={isDarkTheme ? "outline" : "secondary"}
          className={` ${state === "collapsed" ? "ml-2" : "hidden"}`}
        >
          <PlusIcon className="h-5 w-5 text-primary" />
        </Button>
      </div>
    </div>
  );
};

////////////////////////////////////////////////////////////////
///////////////////Quick ShortCutInfo Component/////////////////
////////////////////////////////////////////////////////////////

const QuickShortCutInfo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close dialog when clicking outside or pressing Esc
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  // Keyboard shortcuts organized by category
  const shortcuts = [
    {
      category: "Navigation",
      items: [
        {
          name: "Global Search",
          key: `${isMac ? "⌘" : "Ctrl"}+${isMac ? "" : "Shift+"}K`,
          description: "Search across all conversations",
          modifiers: [isMac ? "Cmd" : "Ctrl", isMac ? null : "Shift", "K"],
        },
        {
          name: "New Chat",
          key: `${isMac ? "⌘" : "Ctrl"}+Shift+O`,
          description: "Create a new chat",
          modifiers: [isMac ? "Cmd" : "Ctrl", "Shift", "O"],
        },
        {
          name: "Toggle Sidebar",
          key: `${isMac ? "⌘" : "Ctrl"}+${isMac ? "" : "Shift+"}B`,
          description: "Toggle the sidebar",
          modifiers: [isMac ? "Cmd" : "Ctrl", "B"],
        },
      ],
    },
  ];

  return (
    <div className="fixed bottom-3 hidden md:flex right-5 z-50">
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        size="icon"
        className="bg-transparent hover:bg-primary/15 dark:hover:bg-border  rounded-full transition transform duration-300"
        aria-label="Keyboard shortcuts help"
      >
        <InfoIcon className="h-5 w-5 text-foreground " />
      </Button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          ref={dialogRef}
          className="absolute right-12 bottom-0 w-80 z-50 bg-background rounded-lg shadow-lg border border-border"
        >
          <div className="p-3 border-b border-border">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold">Keyboard Shortcuts</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
                aria-label="Close shortcuts guide"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <motion.div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-4">
            {shortcuts.map((section, idx) => (
              <div key={idx} className={idx > 0 ? "mt-2" : ""}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {section.category}
                </h4>
                <div className="space-y-3">
                  {section.items.map((shortcut, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{shortcut.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {shortcut.modifiers.filter(Boolean).map((mod, m) => (
                          <Fragment key={m}>
                            {m > 0 && (
                              <span className="text-sm text-muted-foreground">
                                +
                              </span>
                            )}
                            <kbd className="px-2 py-1 text-sm font-mono bg-background border border-border rounded">
                              {mod}
                            </kbd>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

///////////////////////////////////////////////////
/////////////// Welcome Screen Component///////////
///////////////////////////////////////////////////

const promptDomains = [
  {
    id: "create",
    icon: <Sparkles className="h-5 w-5" />,
    name: "Create",
    description: "Generate creative content and ideas",
    prompts: [
      "Write a creative story about a time traveler stuck in ancient Egypt",
      "Create a marketing email for a new fitness app for busy professionals",
      "Design a weekly meal plan for a vegetarian athlete",
      "Generate names for a tech startup focused on augmented reality",
    ],
  },
  {
    id: "explore",
    icon: <Compass className="h-5 w-5" />,
    name: "Explore",
    description: "Discover answers to your questions",
    prompts: [
      "Explain how black holes work in simple terms",
      "Compare and contrast renewable energy sources",
      "What are the main theories about consciousness?",
      "How does the blockchain technology actually work?",
    ],
  },
  {
    id: "code",
    icon: <Code className="h-5 w-5" />,
    name: "Code",
    description: "Get help with programming tasks",
    prompts: [
      "Create a React hook for detecting if an element is in the viewport",
      "Write a Python function to analyze sentiment in a text using NLTK",
      "Explain how to implement a JWT authentication system in Node.js",
      "Debug this code: for(i=0; i<10; i++) { devLog(i); i++; }",
    ],
  },
  {
    id: "learn",
    icon: <BookOpen className="h-5 w-5" />,
    name: "Learn",
    description: "Expand your knowledge and skills",
    prompts: [
      "Explain the basics of quantum computing for beginners",
      "What skills should I develop to become a data scientist in 2025?",
      "Create a learning path for mastering digital illustration",
      "Summarize the key concepts of behavioral economics",
    ],
  },
];

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
  isDarkTheme: boolean;
  selectedDomain: string | null;
  onDomainSelect: (domainId: string) => void;
  // Chat input field props for centered input
  threadId: string;
  input: string;
  status: any;
  setInput: any;
  append: any;
  setMessages: any;
  stop: any;
  pendingUserMessageRef: any;
  onWebSearchMessage: any;
  submitRef: any;
  messages: any;
  onMessageAppended: any;
}

const WelcomeScreen = ({
  onPromptSelect,
  isDarkTheme,
  selectedDomain,
  onDomainSelect,
  threadId,
  input,
  status,
  setInput,
  append,
  setMessages,
  stop,
  pendingUserMessageRef,
  onWebSearchMessage,
  submitRef,
  messages,
  onMessageAppended,
}: WelcomeScreenProps) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Top section with branding and greeting */}
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex flex-col items-center ">
            <CapybaraIcon
              size="lg"
              animated={true}
              showLoader={true}
              className="hidden md:block"
            />

            <CapybaraIcon
              size="sm"
              animated={true}
              showLoader={true}
              className="md:hidden"
            />
          </div>
          <h2 className="text-xl md:text-4xl text-primary font-medium mb-3">
            Welcome Back, {user?.name || "User"}!
            <p className="text-muted-foreground/60 mt-2.5 text-lg max-w-2xl mx-auto leading-relaxed">
              Let's get started! What would you like to chat about today?
            </p>
          </h2>
        </motion.div>

        {/* Centered Chat Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-3xl "
        >
          <ChatInputField
            threadId={threadId}
            input={input}
            status={status}
            setInput={setInput}
            append={append}
            setMessages={setMessages}
            stop={stop}
            pendingUserMessageRef={pendingUserMessageRef}
            onWebSearchMessage={onWebSearchMessage}
            submitRef={submitRef}
            messages={messages}
            onMessageAppended={onMessageAppended}
          />
        </motion.div>
      </div>
    </div>
  );
};
