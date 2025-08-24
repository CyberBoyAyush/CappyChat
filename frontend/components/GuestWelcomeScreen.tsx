/**
 * GuestWelcomeScreen Component
 *
 * Used in: frontend/components/ChatInterface.tsx
 * Purpose: Professional welcome screen for guest users showcasing AI chat features
 * and pricing. Only displayed on / and /chat pages for unauthenticated users.
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import CompareDemo from "./compare-drag-demo";
import {
  MessageSquare,
  Zap,
  Globe,
  Sparkles,
  Check,
  Crown,
  Building2,
  Mail,
  ArrowRight,
  Star,
  Image,
  Layers,
  Bot,
  User,
  Loader2,
  Search,
  Mic,
} from "lucide-react";

interface GuestWelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

// User message component with typing animation
const UserMessage = ({
  content,
  isCurrentMessage,
  isCompleted,
  isTyping,
  onComplete,
}: {
  content: string;
  isCurrentMessage: boolean;
  isCompleted: boolean;
  isTyping: boolean;
  onComplete: () => void;
}) => {
  // If message is completed, show full content immediately
  if (isCompleted) {
    return <div>{content}</div>;
  }

  // If it's the current message but not completed, show typing animation
  if (isCurrentMessage && !isCompleted) {
    return (
      <TypingText
        text={content}
        isVisible={isCurrentMessage && isTyping}
        speed={40}
        onComplete={onComplete}
      />
    );
  }

  // For non-current, non-completed messages, don't show anything
  return null;
};

// Typing animation component
const TypingText = ({
  text,
  isVisible,
  delay = 0,
  speed = 5,
  onComplete,
}: {
  text: string;
  isVisible: boolean;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText("");
      setCurrentIndex(0);
      setHasStarted(false);
      return;
    }

    if (!hasStarted) {
      setHasStarted(true);
      setDisplayedText("");
      setCurrentIndex(0);
    }
  }, [isVisible, hasStarted]);

  useEffect(() => {
    if (!isVisible || !hasStarted) return;

    const timer = setTimeout(
      () => {
        if (currentIndex < text.length) {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        } else if (onComplete && currentIndex === text.length) {
          onComplete();
        }
      },
      currentIndex === 0 ? delay : speed
    );

    return () => clearTimeout(timer);
  }, [isVisible, hasStarted, currentIndex, text, delay, speed, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

// Demo Chat Component
const DemoChat = () => {
  const ref = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const [showThinking, setShowThinking] = useState(false);
  const [isMessageTyping, setIsMessageTyping] = useState(false);
  const [completedMessages, setCompletedMessages] = useState<Set<number>>(
    new Set()
  );
  const [demoFinished, setDemoFinished] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const demoMessages = [
    {
      type: "user",
      content: "Create a simple React welcome component",
      time: "2:34 PM",
      thinkingDelay: 1500, // Time to show thinking after user message
    },
    {
      type: "ai",
      content: `I'll create a clean React welcome component for you:

\`\`\`jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
\`\`\`

This component:
- Accepts a \`name\` prop
- Renders a personalized greeting
- Uses class component syntax`,
      time: "2:35 PM",
      nextMessageDelay: 100, // Time before next user message
    },
    {
      type: "user",
      content: "Can you show the functional component version?",
      time: "2:37 PM",
      thinkingDelay: 1200,
    },
    {
      type: "ai",
      content: `Absolutely! Here's the same component as a function:

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

Much cleaner! This approach:
- Uses modern function syntax
- Same functionality, less code
- Preferred in modern React ✨`,
      time: "2:38 PM",
      nextMessageDelay: 100, // Longer delay before restart
    },
    {
      type: "user",
      content: "What do u mean by Homo Sapiens?",
      time: "2:40 PM",
      thinkingDelay: 1200,
    },
    {
      type: "ai",
      content: `Homo sapiens refers to the species of human beings. It's a Latin term that means "wise human."`,
      time: "2:41 PM",
      nextMessageDelay: 100, // Longer delay before restart
    },
    {
      type: "user",
      content: "What is discrete math?",
      time: "2:43 PM",
      thinkingDelay: 1200,
    },
    {
      type: "ai",
      content: `Discrete math is a branch of mathematics that deals with discrete objects, which are distinct and separate. It includes topics such as set theory, graph theory, combinatorics, and logic. Discrete math is essential in computer science and programming because it provides the foundation for understanding algorithms, data structures, and problem-solving techniques.`,
      time: "2:44 PM",
      nextMessageDelay: 100, // Longer delay before restart
    },
  ];

  useEffect(() => {
    if (isInView && currentMessageIndex === -1 && !demoFinished) {
      // Start with first message after a brief delay
      setTimeout(() => {
        setCurrentMessageIndex(0);
      }, 500);
    }
  }, [isInView, demoFinished]);

  const handleMessageComplete = () => {
    const currentMessage = demoMessages[currentMessageIndex];
    setIsMessageTyping(false);

    // Mark current message as completed immediately
    setCompletedMessages((prev) => new Set([...prev, currentMessageIndex]));

    if (currentMessageIndex < demoMessages.length - 1) {
      const nextMessage = demoMessages[currentMessageIndex + 1];

      // If current message is user and next is AI, show thinking state
      if (currentMessage?.type === "user" && nextMessage?.type === "ai") {
        setShowThinking(true);
        setTimeout(() => {
          setShowThinking(false);
          setCurrentMessageIndex((prev) => prev + 1);
          setIsMessageTyping(true);
        }, currentMessage?.thinkingDelay || 1500);
      } else {
        // AI to user message transition
        setTimeout(() => {
          setCurrentMessageIndex((prev) => prev + 1);
          setIsMessageTyping(true);
        }, currentMessage?.nextMessageDelay || 2000);
      }
    } else {
      // Demo completed - mark as finished and stop looping
      setDemoFinished(true);
      setCurrentMessageIndex(-1);
      setShowThinking(false);
      setIsMessageTyping(false);
    }
  };

  // Set typing state when a new message starts
  useEffect(() => {
    if (currentMessageIndex >= 0) {
      setIsMessageTyping(true);
    }
  }, [currentMessageIndex]);

  // Auto-scroll to bottom during message generation
  const scrollToBottom = () => {
    if (scrollRef.current && !isUserScrolling) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Detect user scrolling
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      setIsUserScrolling(!isAtBottom);
    }
  };

  // Auto-scroll when new messages appear or during typing
  useEffect(() => {
    scrollToBottom();
  }, [currentMessageIndex, showThinking, isMessageTyping]);

  // Auto-scroll during typing animation
  useEffect(() => {
    if (isMessageTyping && !isUserScrolling) {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [isMessageTyping, isUserScrolling]);

  // Function to restart the demo
  const restartDemo = () => {
    setCurrentMessageIndex(-1);
    setShowThinking(false);
    setIsMessageTyping(false);
    setCompletedMessages(new Set());
    setDemoFinished(false);
    setIsUserScrolling(false);
    // Start demo after a brief delay
    setTimeout(() => {
      setCurrentMessageIndex(0);
      setIsMessageTyping(true);
    }, 300);
  };

  // Render static content with syntax highlighting for completed messages
  const renderStaticContent = (content: string) => {
    const codeBlockRegex = /```(jsx|javascript|js)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textPart = content.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${parts.length}`} className="whitespace-pre-wrap">
            {textPart}
          </span>
        );
      }

      // Add code block with syntax highlighting
      const codeContent = match[2];
      parts.push(
        <div key={`code-${parts.length}`} className="my-4">
          <div className=" border border-muted-foreground/25 overflow-hidden rounded-lg  code-block">
            <div className="flex items-center bg-card gap-2 p-4 pb-2 border-b border-muted-foreground/25">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-foreground dark:text-zinc-400 text-xs ml-2 font-medium">
                React Component
              </span>
            </div>
            <div className="text-foreground p-4 bg-card dark:bg-background dark:text-zinc-200 font-mono text-sm">
              <pre className="whitespace-pre-wrap">{codeContent}</pre>
            </div>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      parts.push(
        <span key={`text-${parts.length}`} className="whitespace-pre-wrap">
          {remainingText}
        </span>
      );
    }

    return <div>{parts}</div>;
  };

  const renderMessageContent = (content: string, messageIndex: number) => {
    const isCurrentMessage = messageIndex === currentMessageIndex;
    const isCompleted = completedMessages.has(messageIndex);
    const shouldShowTyping = isCurrentMessage && isMessageTyping;

    // For completed messages (including when thinking is shown), show full content with syntax highlighting
    if (isCompleted) {
      return renderStaticContent(content);
    }

    // For current message that's not completed yet, show typing animation
    if (isCurrentMessage && !isCompleted) {
      // Continue with typing animation logic below
    } else {
      // For non-current, non-completed messages, don't show anything
      return null;
    }

    // For current message, handle typing animation
    const codeBlockRegex = /```(jsx|javascript|js)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let totalTextLength = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textPart = content.slice(lastIndex, match.index);
        parts.push(
          <TypingText
            key={`text-${parts.length}`}
            text={textPart}
            isVisible={shouldShowTyping}
            speed={25}
            delay={totalTextLength * 25}
          />
        );
        totalTextLength += textPart.length;
      }

      // Add code block
      const codeContent = match[2];
      parts.push(
        <div key={`code-${parts.length}`} className="my-4">
          <div className=" border border-muted-foreground/25 overflow-hidden rounded-lg  code-block">
            <div className="flex items-center bg-card gap-2 p-4 pb-2 border-b border-muted-foreground/25">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-foreground dark:text-zinc-400 text-xs ml-2 font-medium">
                React Component
              </span>
            </div>
            <div className="text-foreground p-4 bg-card dark:bg-background dark:text-zinc-200 font-mono text-sm">
              <TypingText
                text={codeContent}
                isVisible={shouldShowTyping}
                speed={15}
                delay={totalTextLength * 25}
              />
            </div>
          </div>
        </div>
      );
      totalTextLength += codeContent.length;

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      parts.push(
        <TypingText
          key={`text-${parts.length}`}
          text={remainingText}
          isVisible={shouldShowTyping}
          speed={25}
          delay={totalTextLength * 25}
          onComplete={handleMessageComplete}
        />
      );
    } else if (parts.length > 0) {
      // If we ended with a code block, trigger completion after typing finishes
      setTimeout(() => {
        if (isCurrentMessage) {
          handleMessageComplete();
        }
      }, totalTextLength * 25 + 500);
    }

    return <div>{parts}</div>;
  };

  return (
    <div
      ref={ref}
      className="bg-card/30 backdrop-blur-sm border border-zinc-300 dark:border-zinc-300/10 rounded-2xl p-6 h-[600px] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-300 dark:border-zinc-300/10">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AVChat Demo</h3>
          <p className="text-xs text-muted-foreground">
            Live coding assistance
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live Demo
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
      >
        {demoMessages.map((message, index) => {
          const isCurrentMessage = index === currentMessageIndex;
          const isCompleted = completedMessages.has(index);
          const shouldShow = isCurrentMessage || isCompleted;

          if (!shouldShow) return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "flex gap-3",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.type === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm relative",
                  message.type === "user"
                    ? "bg-secondary rounded-br-md shadow-lg"
                    : "bg-muted/50 border border-border/30 rounded-bl-md shadow-sm"
                )}
              >
                <div className="leading-relaxed">
                  {message.type === "user" ? (
                    <UserMessage
                      content={message.content}
                      isCurrentMessage={index === currentMessageIndex}
                      isCompleted={completedMessages.has(index)}
                      isTyping={isMessageTyping}
                      onComplete={handleMessageComplete}
                    />
                  ) : (
                    renderMessageContent(message.content, index)
                  )}
                </div>
                <div
                  className={cn(
                    "text-xs mt-3 opacity-70 flex items-center gap-2",
                    message.type === "user"
                      ? "dark:text-primary-foreground/70 text-muted-foreground"
                      : "dark:text-muted-foreground text-muted-foreground"
                  )}
                >
                  <span>{message.time}</span>
                </div>
              </div>
              {message.type === "user" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/30">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </motion.div>
          );
        })}

        {showThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AVChat is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {demoFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={restartDemo}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm text-primary font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Replay Demo
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default function GuestWelcomeScreen({
  onSignUp,
  onLogin,
}: GuestWelcomeScreenProps) {
  return (
    <div className="min-h-screen pt-6">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-primary/10 rounded-full blur-lg animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-pulse delay-2000" />
      </div>

      <div className="relative container mx-auto px-4 pb-12 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Next-Generation AI Chat Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground dark:via-primary to-foreground bg-clip-text text-transparent">
              Welcome to
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-foreground">
              AV<span className="text-primary">Chat</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience intelligent conversations with 20+ advanced AI models.
            Fast, secure, and designed for the future of communication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={onSignUp}
              size="lg"
              className="bg-primary text-primary-foreground px-8 py-5 text-lg font-medium group"
            >
              Start Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={onLogin}
              size="lg"
              className="px-8 py-5 text-primary dark:text-foreground text-lg border-[1px] border-primary/20 bg-background hover:bg-border/5 font-medium"
            >
              Sign In
            </Button>
          </div>

          {/* Quick Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4 justify-center mx-auto mt-8 flex-wrap"
          >
            {/* Web Search Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="group flex items-center gap-2 bg-gradient-to-r from-muted/15 to-muted/8 hover:from-muted/20 hover:to-primary/8 rounded-full px-3 py-1.5 border border-primary/20 hover:border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ease-out cursor-pointer backdrop-blur-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted/25 to-muted/15 group-hover:from-muted/30 group-hover:to-primary/15 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-out">
                <Search className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-500 ease-out" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-primary text-xs whitespace-nowrap transition-colors duration-500 ease-out">
                Web Search
              </span>
            </motion.div>

            {/* Image Generation Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="group flex items-center gap-2 bg-gradient-to-r from-muted/15 to-muted/8 hover:from-muted/20 hover:to-primary/8 rounded-full px-3 py-1.5 border border-primary/20 hover:border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ease-out cursor-pointer backdrop-blur-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted/25 to-muted/15 group-hover:from-muted/30 group-hover:to-primary/15 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-out">
                <Image className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-500 ease-out" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-primary text-xs whitespace-nowrap transition-colors duration-500 ease-out">
                Image Generation
              </span>
            </motion.div>

            {/* 20+ AI Models Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="group flex items-center gap-2 bg-gradient-to-r from-muted/15 to-muted/8 hover:from-muted/20 hover:to-primary/8 rounded-full px-3 py-1.5 border border-primary/20 hover:border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ease-out cursor-pointer backdrop-blur-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted/25 to-muted/15 group-hover:from-muted/30 group-hover:to-primary/15 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-out">
                <Layers className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-500 ease-out" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-primary text-xs whitespace-nowrap transition-colors duration-500 ease-out">
                20+ AI Models
              </span>
            </motion.div>

            {/* Voice Input Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="group flex items-center gap-2 bg-gradient-to-r from-muted/15 to-muted/8 hover:from-muted/20 hover:to-primary/8 rounded-full px-3 py-1.5 border border-primary/20 hover:border-primary/20 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ease-out cursor-pointer backdrop-blur-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted/25 to-muted/15 group-hover:from-muted/30 group-hover:to-primary/15 flex items-center justify-center group-hover:scale-105 transition-all duration-500 ease-out">
                <Mic className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-500 ease-out" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-primary text-xs whitespace-nowrap transition-colors duration-500 ease-out">
                Voice Input
              </span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20 relative"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl -z-10" />

          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6"
            >
              <Zap className="h-4 w-4" />
              Powerful Features
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              Why Choose AV<span className="text-primary">Chat</span>?
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              Discover the cutting-edge features that make AVChat the preferred
              choice for intelligent conversations and seamless AI interactions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={cn(
                "relative p-8 rounded-2xl border border-border/30 text-center group hover:border-primary/40 transition-all duration-500",
                "bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md",
                "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Multiple AI Models
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  From OpenAI's GPT to Claude Sonnet, access 20+ cutting-edge
                  models for every conversation need
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={cn(
                "relative p-8 rounded-2xl border border-border/30 text-center group hover:border-primary/40 transition-all duration-500",
                "bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md",
                "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Image className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Image Generation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transform ideas into visuals with advanced text-to-image and
                  image-to-image AI capabilities
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={cn(
                "relative p-8 rounded-2xl border border-border/30 text-center group hover:border-primary/40 transition-all duration-500",
                "bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md",
                "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Lightning Fast
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Experience blazing-fast AI responses with optimized
                  infrastructure for seamless conversations
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={cn(
                "relative p-8 rounded-2xl border border-border/30 text-center group hover:border-primary/40 transition-all duration-500",
                "bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-md",
                "hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
                "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100"
              )}
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 group-hover:scale-110">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  Real-time Sync
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seamless conversation synchronization across all your devices
                  with instant real-time updates
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See AV<span className="text-primary">Chat</span> in Action
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Watch how our AI handles code generation, image creation, and
              intelligent conversations
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <DemoChat />
          </div>

          {/* Theme Demo Section */}
          <div className="text-center mb-5 mt-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Theme Customization
            </motion.div>
            <h3 className="text-2xl md:text-4xl font-bold mb-4">
              Light & Dark Theme
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              AVChat automatically adapts to your system preferences or manual
              theme selection. Experience the seamless transition between our
              beautifully crafted light and dark modes.
            </p>
          </div>

          <div className="max-w-4xl mx-auto flex justify-center">
            <CompareDemo />
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Choose the perfect plan for your AI conversation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="p-8 rounded-2xl border border-border/50 relative bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Starter</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfect for trying out
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">80 budget model prompts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">
                    10 premium credits (Chat + Image Gen)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Basic conversation history</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Standard support</span>
                </li>
              </ul>

              <Button
                onClick={onSignUp}
                className="w-full py-3 bg-primary/85 font-medium"
              >
                Get Started Free
              </Button>
            </motion.div>

            {/* Pro Plan - Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="p-8 rounded-2xl border-2 border-primary/50 relative bg-card/70 backdrop-blur-sm hover:border-primary/60 transition-all duration-300 scale-105"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Most Popular
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pro</h3>
                  <p className="text-sm text-muted-foreground">
                    For power users
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$12</span>
                <span className="text-muted-foreground text-lg">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">1200 budget model prompts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">
                    600 premium credits (Chat + Image Gen)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">50 super premium credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Priority response speed</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Advanced conversation history</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <Button
                onClick={onSignUp}
                className="w-full py-3 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Upgrade to Pro
              </Button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="p-8 rounded-2xl border border-border/50 relative bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Enterprise</h3>
                  <p className="text-sm text-muted-foreground">
                    For teams & businesses
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
                <span className="text-muted-foreground text-lg"> pricing</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Unlimited model access</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Custom API integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Advanced security</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">Custom model fine-tuning</span>
                </li>
              </ul>

              <Button
                className="w-full py-3 font-medium bg-primary/85"
                onClick={() => window.open("mailto:connect@ayush-sharma.in")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="p-12 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Experience the Future?
              </h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Join thousands of users already experiencing intelligent
                conversations with AVChat. Start your journey with AI-powered
                communication today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={onSignUp}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-5 text-lg font-medium group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={onLogin}
                  size="lg"
                  className="px-8 py-5 text-lg border-[1px] text-primary dark:text-foreground border-primary/20 bg-background hover:bg-border/35 font-medium"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
