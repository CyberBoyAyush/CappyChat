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
import { UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { AppwriteDB } from "@/lib/appwriteDB";
import { HybridDB } from "@/lib/hybridDB";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useModelStore } from "@/frontend/stores/ChatModelStore";

import ThemeToggleButton from "./ui/ThemeComponents";
import { Button } from "./ui/button";
import { MessageSquareMore, PanelLeftIcon, ArrowDown } from "lucide-react";
import { useChatMessageNavigator } from "@/frontend/hooks/useChatMessageNavigator";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

interface ChatInterfaceProps {
  threadId: string;
  initialMessages: UIMessage[];
}

export default function ChatInterface({
  threadId,
  initialMessages,
}: ChatInterfaceProps) {
  const selectedModel = useModelStore((state) => state.selectedModel);
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
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  } = useChatMessageNavigator();

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
    api: "/api/chat-messaging",
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async (message) => {
      const aiMessage: UIMessage = {
        id: uuidv4(),
        parts: message.parts as UIMessage["parts"],
        role: "assistant",
        content: message.content,
        createdAt: new Date(),
      };

      // Save AI message instantly with local update + async backend sync
      HybridDB.createMessage(threadId, aiMessage);

      // Scroll to bottom when new message comes in
      scrollToBottom();
    },
    headers: {},
    body: {
      model: selectedModel,
    },
  });

  // Check if user has scrolled up
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = mainElement;
      const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollToBottom(isNotAtBottom);
    };

    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll to bottom when new message is added
  useEffect(() => {
    if (status === "streaming" || messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, status]);

  const scrollToBottom = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: mainRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    setShowScrollToBottom(false);
  };

  return (
    <div className="relative w-full h-screen flex flex-col bg-background">
      <AppPanelTrigger />
      <main ref={mainRef} className="flex-1 overflow-y-auto pt-6 pb-40">
        <div className="container mx-auto px-4 max-w-4xl">
          <ChatMessageDisplay
            threadId={threadId}
            messages={messages}
            status={status}
            setMessages={setMessages}
            reload={reload}
            error={error}
            registerRef={registerRef}
            stop={stop}
          />
        </div>
      </main>

      {/* Fixed Input Container with Dynamic Width */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        {/* Scroll to bottom button */}
        <div
          className={cn(
            "flex justify-center transition-opacity duration-300",
            showScrollToBottom ? "opacity-100" : "opacity-0 pointer-events-none"
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
            className="rounded-full shadow-lg bg-primary/90 hover:bg-primary text-primary-foreground mb-2 transition-all duration-200 "
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4 md:mr-1" />
            <span className="text-xs hidden md:block">Latest messages</span>
          </Button>
        </div>

        <div
          className={cn(
            "flex justify-center px-4",
            isMobile ? "w-full" : sidebarState === "open" ? "ml-auto" : "w-full"
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
          <div className="w-full max-w-4xl">
            <ChatInputField
              threadId={threadId}
              input={input}
              status={status}
              append={append}
              setInput={setInput}
              stop={stop}
            />
          </div>
        </div>
      </div>

      {/* Fixed action buttons */}
      <div className="fixed top-2 right-4 z-50 flex gap-2">
        <Button
          onClick={handleToggleNavigator}
          variant="outline"
          size="icon"
          className="focus-enhanced"
          aria-label={
            isNavigatorVisible ? "Hide message browser" : "Show message browser"
          }
        >
          <MessageSquareMore className="h-5 w-5" />
        </Button>
        <ThemeToggleButton variant="inline" />
      </div>

      <ChatMessageBrowser
        threadId={threadId}
        scrollToMessage={scrollToMessage}
        isVisible={isNavigatorVisible}
        onClose={closeNavigator}
      />
    </div>
  );
}

const AppPanelTrigger = () => {
  const { sidebarWidth, toggleSidebar, state, isMobile } = useOutletContext<{
    sidebarWidth: number;
    toggleSidebar: () => void;
    state: "open" | "collapsed";
    isMobile: boolean;
  }>();

  // Enhanced toggle function for debugging
  const handleToggle = () => {
    console.log("Panel trigger clicked, current state:", state);
    toggleSidebar();
  };

  // Show trigger on mobile or when sidebar is collapsed on desktop
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={handleToggle}
      className={`fixed left-2 top-1 z-50 bg-transparent hover:bg-zinc-600/10 `}
      aria-label="Toggle sidebar"
    >
      <PanelLeftIcon className="h-5 w-5" />
    </Button>
  );
};
