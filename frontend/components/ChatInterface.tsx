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

import { HybridDB } from "@/lib/hybridDB";
import { useModelStore } from "@/frontend/stores/ChatModelStore";
import { useWebSearchStore } from "@/frontend/stores/WebSearchStore";
import { useLocation } from "react-router-dom";
import ThemeToggleButton from "./ui/ThemeComponents";
import { Button } from "./ui/button";
import {
  MessageSquareMore,
  PanelLeftIcon,
  ArrowDown,
  ChevronLeftIcon,
  Code,
  Search,
  BookOpen,
  FileQuestion,
  Compass,
  Brain,
  Bot,
  Sparkles,
  Laptop,
  ChevronRight,
} from "lucide-react";
import { useChatMessageNavigator } from "@/frontend/hooks/useChatMessageNavigator";
import { useOutletContext } from "react-router-dom";
import { useIsMobile } from "@/hooks/useMobileDetection";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
  threadId: string;
  initialMessages: UIMessage[];
}

// Define domain categories for suggested prompts with more specific questions

export default function ChatInterface({
  threadId,
  initialMessages,
}: ChatInterfaceProps) {
  const selectedModel = useModelStore((state) => state.selectedModel);
  const { isWebSearchEnabled } = useWebSearchStore();
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
  const pendingUserMessageRef = useRef<UIMessage | null>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const location = useLocation();
  const isHomePage = location.pathname === "/chat";

  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

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
    api: isWebSearchEnabled ? "/api/web-search" : "/api/chat-messaging",
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async (message) => {
      // Save the pending user message if it exists
      if (pendingUserMessageRef.current) {
        HybridDB.createMessage(threadId, pendingUserMessageRef.current);
        pendingUserMessageRef.current = null;
      }

      // Save the AI message (useChat already handles adding it to the messages array)
      // We just need to persist it to the database using the actual message ID from useChat
      const aiMessage: UIMessage & { webSearchResults?: string[] } = {
        id: message.id,
        parts: message.parts as UIMessage["parts"],
        role: "assistant",
        content: message.content,
        createdAt: new Date(),
      };

      // Add web search results if this message was sent with web search enabled
      if (nextResponseNeedsWebSearch.current) {
        // For now, add sample web search results when web search was enabled
        // This will be replaced with actual grounding metadata extraction
        const webSearchResults = [
          'https://makemytrip.com',
          'https://planetware.com',
          'https://delhitourism.gov.in',
          'https://holidify.com',
          'https://traveltriangle.com',
        ];

        console.log('✅ Adding web search results to AI message:', message.id, webSearchResults);
        aiMessage.webSearchResults = webSearchResults;

        // Reset the flag
        nextResponseNeedsWebSearch.current = false;

        // Also update the message in the UI immediately
        setMessages(prevMessages => {
          const updatedMessages = prevMessages.map(msg =>
            msg.id === message.id
              ? { ...msg, webSearchResults } as UIMessage & { webSearchResults?: string[] }
              : msg
          );
          console.log('📱 Updated UI messages with web search results');
          return updatedMessages;
        });
      } else {
        console.log('❌ No web search results needed for message:', message.id);
      }

      HybridDB.createMessage(threadId, aiMessage);

      // Scroll to bottom when new message comes in
      scrollToBottom();
    },
    headers: {},
    body: {
      model: selectedModel,
    },
  });

  // Effect to handle selected prompt
  useEffect(() => {
    if (selectedPrompt) {
      setInput(selectedPrompt);
      setSelectedPrompt("");
    }
  }, [selectedPrompt, setInput]);

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

  // Track when web search is enabled for the next assistant response
  const nextResponseNeedsWebSearch = useRef<boolean>(false);

  // Callback to track when a message is sent with web search enabled
  const handleWebSearchMessage = useCallback((messageId: string) => {
    console.log('🔍 Web search enabled for next response. User message ID:', messageId);
    nextResponseNeedsWebSearch.current = true;
  }, []);

  // This useEffect is no longer needed since we handle web search results in onFinish
  // Keeping it commented for reference
  // useEffect(() => {
  //   // Web search results are now handled in the onFinish callback
  // }, []);

  const scrollToBottom = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: mainRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    setShowScrollToBottom(false);
  };

  const sidebarOpen = localStorage.getItem("sidebarOpen") === "true";

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId === selectedDomain ? null : domainId);
  };

  return (
    <div
      className={cn(
        "relative w-full h-screen border-primary/30 flex flex-col bg-background dark:bg-card  border-t-[1px] border-l-[1px] rounded-tl-xl mt-5"
      )}
    >
      <AppPanelTrigger />
      <main ref={mainRef} className="flex-1 overflow-y-auto pt-14 pb-40">
        {isHomePage && messages.length === 0 ? (
          <WelcomeScreen
            onPromptSelect={handlePromptClick}
            isDarkTheme={isDarkTheme}
            selectedDomain={selectedDomain}
            onDomainSelect={handleDomainSelect}
          />
        ) : (
          <div className="mx-auto flex justify-center px-4 overflow-x-hidden">
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
        )}
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
            className={cn(
              "rounded-full shadow-lg text-primary-foreground mb-2 transition-all duration-200",
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
          <div className="w-full max-w-3xl">
            <ChatInputField
              threadId={threadId}
              input={input}
              status={status}
              append={append}
              setInput={setInput}
              stop={stop}
              pendingUserMessageRef={pendingUserMessageRef}
              onWebSearchMessage={handleWebSearchMessage}
            />
          </div>
        </div>
      </div>

      {/* Fixed action buttons */}
      <div className={cn("fixed top-8 right-0 z-50")}>
        <div
          className={cn(
            "flex gap-2 bg-background mr-6 ml-3 rounded-md px-2 py-2"
          )}
        >
          <Button
            onClick={handleToggleNavigator}
            variant={isDarkTheme ? "outline" : "secondary"}
            size="icon"
            className={cn("focus-enhanced shadow-sm rounded-md ")}
            aria-label={
              isNavigatorVisible
                ? "Hide message browser"
                : "Show message browser"
            }
          >
            <MessageSquareMore className="h-5 w-5" />
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

  const sidebarOpen = localStorage.getItem("sidebarOpen") === "true";

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
      "Debug this code: for(i=0; i<10; i++) { console.log(i); i++; }",
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
}

const WelcomeScreen = ({
  onPromptSelect,
  isDarkTheme,
  selectedDomain,
  onDomainSelect,
}: WelcomeScreenProps) => {
  return (
    <div className="container mx-auto px-4 py-3 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-5"
      >
        <h1 className="text-lg md:text-2xl font-bold mb-1">
          How can I help you, today?
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto">
          Select a category below or type your own message to get started
        </p>
      </motion.div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {promptDomains.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.1 * index,
            }}
            className={cn(
              "rounded-2xl p-3 cursor-pointer transition-all border border-border",
              isDarkTheme ? "hover:bg-zinc-700/50" : "hover:bg-primary/10",
              selectedDomain === category.id &&
                (isDarkTheme
                  ? "bg-zinc-700/70 border-primary/50"
                  : "bg-primary/10 border-primary/50")
            )}
            onClick={() => onDomainSelect(category.id)}
          >
            <div className="flex flex-col items-center text-center">
              <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Domain-specific Prompts Section */}
      <AnimatePresence>
        {selectedDomain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-10 overflow-hidden"
          >
            <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                {promptDomains.find((d) => d.id === selectedDomain)?.icon}
                <span className="ml-2">
                  {promptDomains.find((d) => d.id === selectedDomain)?.name}{" "}
                  Prompts
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {promptDomains
                  .find((domain) => domain.id === selectedDomain)
                  ?.prompts.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      <Button
                        variant="ghost"
                        className={`justify-start text-left h-auto py-3 px-4 w-full ${
                          isDarkTheme
                            ? "hover:bg-zinc-700/50"
                            : "hover:bg-primary/10"
                        }`}
                        onClick={() => onPromptSelect(prompt)}
                      >
                        <FileQuestion className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{prompt}</span>
                      </Button>
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular Prompts Section - Only shown when no domain is selected */}
      {!selectedDomain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Popular prompts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "How does AI work?",
              "Are black holes real?",
              'How many Rs are in the word "strawberry"?',
              "What is the meaning of life?",
            ].map((prompt, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`justify-start text-left h-auto py-3 px-4 ${
                  isDarkTheme ? "hover:bg-zinc-700/50" : "hover:bg-primary/10"
                }`}
                onClick={() => onPromptSelect(prompt)}
              >
                <FileQuestion className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{prompt}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
