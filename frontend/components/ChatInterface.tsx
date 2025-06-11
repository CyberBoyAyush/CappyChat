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
import { createMessage } from "@/frontend/database/chatQueries";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import ThemeToggleButton from "./ui/ThemeComponents";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { MessageSquareMore, PanelLeftIcon } from "lucide-react";
import { useChatMessageNavigator } from "@/frontend/hooks/useChatMessageNavigator";

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
    onFinish: async ({ parts }) => {
      const aiMessage: UIMessage = {
        id: uuidv4(),
        parts: parts as UIMessage["parts"],
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      try {
        await createMessage(threadId, aiMessage);
      } catch (error) {
        console.error(error);
      }
    },
    headers: {},
    body: {
      model: selectedModel,
    },
  });

  return (
    <div className="relative w-full min-h-screen bg-background">
      <AppPanelTrigger />
      <main
        className={`flex flex-col w-full mobile-container mobile-padding pt-20 sm:pt-10 pb-32 sm:pb-44 transition-all duration-300 ease-in-out`}
      >
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
        <ChatInputField
          threadId={threadId}
          input={input}
          status={status}
          append={append}
          setInput={setInput}
          stop={stop}
        />
      </main>

      {/* Fixed action buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
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
  const { state, isMobile, toggleSidebar } = useSidebar();

  // Show trigger on mobile or when sidebar is collapsed on desktop
  if (isMobile || state === "collapsed") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 focus-enhanced"
        aria-label="Toggle sidebar"
      >
        <PanelLeftIcon className="h-5 w-5" />
      </Button>
    );
  }
  return null;
};
