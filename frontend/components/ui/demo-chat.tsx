import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import ShikiHighlighter from "react-shiki";
import { MessageSquare, Bot, User } from "lucide-react";

import CapybaraIcon from "./CapybaraIcon";
import { cn } from "@/lib/utils";

interface DemoMessage {
  type: "user" | "ai";
  content: string;
  time: string;
  thinkingDelay?: number;
  nextMessageDelay?: number;
}

const DEMO_MESSAGES: DemoMessage[] = [
  {
    type: "user",
    content: "Create a simple React welcome component",
    time: "2:34 PM",
    thinkingDelay: 1500,
  },
  {
    type: "ai",
    content: `I'll create a clean React welcome component for you:\n\n\`\`\`jsx\nclass Welcome extends React.Component {\n  render() {\n    return <h1>Hello, {this.props.name}</h1>;\n  }\n}\n\`\`\`\n\nThis component:\n- Accepts a \`name\` prop\n- Renders a personalized greeting\n- Uses class component syntax`,
    time: "2:35 PM",
    nextMessageDelay: 100,
  },
  {
    type: "user",
    content: "Can you show the functional component version?",
    time: "2:37 PM",
    thinkingDelay: 1200,
  },
  {
    type: "ai",
    content: `Absolutely! Here's the same component as a function:\n\n\`\`\`jsx\nfunction Welcome(props) {\n  return <h1>Hello, {props.name}</h1>;\n}\n\`\`\`\n\nMuch cleaner! This approach:\n- Uses modern function syntax\n- Same functionality, less code\n- Preferred in modern React ✨`,
    time: "2:38 PM",
    nextMessageDelay: 100,
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
    nextMessageDelay: 100,
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
    nextMessageDelay: 100,
  },
];

function useThemeDetection() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const computeIsDark = () => {
      const root = document.documentElement;
      return (
        root.classList.contains("dark") ||
        root.classList.contains("capybara-dark")
      );
    };

    setIsDarkMode(computeIsDark());

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          setIsDarkMode(computeIsDark());
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
}

interface TypingTextProps {
  text: string;
  isVisible: boolean;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
}

const TypingText = ({
  text,
  isVisible,
  delay = 0,
  speed = 5,
  onComplete,
}: TypingTextProps) => {
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

    const timer = window.setTimeout(
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

    return () => window.clearTimeout(timer);
  }, [isVisible, hasStarted, currentIndex, text, delay, speed, onComplete]);

  return <span className="">{displayedText}</span>;
};

interface UserMessageProps {
  content: string;
  isCurrentMessage: boolean;
  isCompleted: boolean;
  isTyping: boolean;
  onComplete: () => void;
}

const UserMessage = ({
  content,
  isCurrentMessage,
  isCompleted,
  isTyping,
  onComplete,
}: UserMessageProps) => {
  if (isCompleted) {
    return <span className="">{content}</span>;
  }

  if (isCurrentMessage && isTyping) {
    return (
      <TypingText
        text={content}
        isVisible={isTyping}
        speed={40}
        onComplete={onComplete}
      />
    );
  }

  return null;
};

interface TypingCodeBlockProps {
  code: string;
  language: string;
  isVisible: boolean;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
  isDarkMode: boolean;
}

const TypingCodeBlock = ({
  code,
  language,
  isVisible,
  delay = 0,
  speed = 15,
  onComplete,
  isDarkMode,
}: TypingCodeBlockProps) => {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setDisplayedCode("");
      setCurrentIndex(0);
      setHasStarted(false);
      return;
    }

    if (!hasStarted) {
      setHasStarted(true);
      setDisplayedCode("");
      setCurrentIndex(0);
    }
  }, [isVisible, hasStarted]);

  useEffect(() => {
    if (!isVisible || !hasStarted) return;

    const timer = window.setTimeout(
      () => {
        if (currentIndex < code.length) {
          setDisplayedCode((prev) => prev + code[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        } else if (onComplete && currentIndex === code.length) {
          onComplete();
        }
      },
      currentIndex === 0 ? delay : speed
    );

    return () => window.clearTimeout(timer);
  }, [isVisible, hasStarted, currentIndex, code, delay, speed, onComplete]);

  return (
    <div className="bg-card dark:bg-background overflow-x-auto">
      <ShikiHighlighter
        language={language}
        theme={isDarkMode ? "github-dark" : "min-light"}
        className="text-sm font-mono overflow-x-auto bg-transparent min-w-0 max-w-full"
        showLanguage={false}
      >
        {displayedCode}
      </ShikiHighlighter>
    </div>
  );
};

const renderStaticContent = (content: string, isDarkMode: boolean) => {
  const codeBlockRegex = /```(jsx|javascript|js)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textPart = content.slice(lastIndex, match.index);
      parts.push(
        <span key={`text-${parts.length}`} className="mb-2 block ">
          {textPart}
        </span>
      );
    }

    const codeContent = match[2];
    const language = match[1] || "javascript";

    parts.push(
      <div key={`code-${parts.length}`} className="my-4">
        <div className="border border-muted-foreground/25 overflow-hidden rounded-lg code-block">
          <div className="bg-card dark:bg-background overflow-x-auto">
            <ShikiHighlighter
              language={language}
              theme={isDarkMode ? "github-dark" : "min-light"}
              className="text-sm font-mono overflow-x-auto bg-transparent min-w-0 max-w-full"
              showLanguage={false}
            >
              {codeContent}
            </ShikiHighlighter>
          </div>
        </div>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    parts.push(
      <span key={`text-${parts.length}`} className="mt-2 block">
        {remainingText}
      </span>
    );
  }

  return <div>{parts}</div>;
};

const DemoChatComponent = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const [showThinking, setShowThinking] = useState(false);
  const [isMessageTyping, setIsMessageTyping] = useState(false);
  const [completedMessages, setCompletedMessages] = useState<Set<number>>(
    new Set()
  );
  const [demoFinished, setDemoFinished] = useState(false);
  const isDarkMode = useThemeDetection();
  const timeoutsRef = useRef<number[]>([]);

  const clearScheduled = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((cb: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      cb();
      timeoutsRef.current = timeoutsRef.current.filter(
        (storedId) => storedId !== id
      );
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => () => clearScheduled(), [clearScheduled]);

  useEffect(() => {
    if (isInView && currentMessageIndex === -1 && !demoFinished) {
      scheduleTimeout(() => {
        setCurrentMessageIndex(0);
        setIsMessageTyping(true);
      }, 500);
    }
  }, [isInView, currentMessageIndex, demoFinished, scheduleTimeout]);

  useEffect(() => {
    if (currentMessageIndex >= 0) {
      setIsMessageTyping(true);
    }
  }, [currentMessageIndex]);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;

    const { current } = scrollRef;
    isProgrammaticScrollRef.current = true;
    current.scrollTop = current.scrollHeight;
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessageIndex, showThinking, isMessageTyping, scrollToBottom]);

  useEffect(() => {
    if (!isMessageTyping) return;

    const interval = window.setInterval(scrollToBottom, 50);
    return () => window.clearInterval(interval);
  }, [isMessageTyping, scrollToBottom]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const maintainScrollLock = () => {
      if (isProgrammaticScrollRef.current) return;
      scrollToBottom();
    };

    const lockOnGesture = () => {
      if (isProgrammaticScrollRef.current) return;
      scrollToBottom();
    };

    container.addEventListener("wheel", lockOnGesture, { passive: true });
    container.addEventListener("touchmove", lockOnGesture, { passive: true });
    container.addEventListener("scroll", maintainScrollLock, { passive: true });

    return () => {
      container.removeEventListener("wheel", lockOnGesture);
      container.removeEventListener("touchmove", lockOnGesture);
      container.removeEventListener("scroll", maintainScrollLock);
    };
  }, [scrollToBottom]);

  const handleMessageComplete = useCallback(() => {
    if (currentMessageIndex < 0) return;

    const currentMessage = DEMO_MESSAGES[currentMessageIndex];
    const nextIndex = currentMessageIndex + 1;
    const nextMessage = DEMO_MESSAGES[nextIndex];

    setIsMessageTyping(false);
    setCompletedMessages((prev) => {
      const updated = new Set(prev);
      updated.add(currentMessageIndex);
      return updated;
    });

    if (nextMessage) {
      if (currentMessage?.type === "user" && nextMessage?.type === "ai") {
        setShowThinking(true);
        scheduleTimeout(() => {
          setShowThinking(false);
          setCurrentMessageIndex(nextIndex);
          setIsMessageTyping(true);
        }, currentMessage?.thinkingDelay ?? 1500);
      } else {
        scheduleTimeout(() => {
          setCurrentMessageIndex(nextIndex);
          setIsMessageTyping(true);
        }, currentMessage?.nextMessageDelay ?? 2000);
      }
    } else {
      setDemoFinished(true);
      setShowThinking(false);
      setCurrentMessageIndex(-1);
      setIsMessageTyping(false);
    }
  }, [currentMessageIndex, scheduleTimeout]);

  const restartDemo = useCallback(() => {
    clearScheduled();
    setCurrentMessageIndex(-1);
    setShowThinking(false);
    setIsMessageTyping(false);
    setCompletedMessages(new Set());
    setDemoFinished(false);
  }, [clearScheduled]);

  const renderMessageContent = useCallback(
    (content: string, messageIndex: number) => {
      const isCurrentMessage = messageIndex === currentMessageIndex;
      const isCompleted = completedMessages.has(messageIndex);
      const shouldShowTyping = isCurrentMessage && isMessageTyping;

      if (isCompleted) {
        return renderStaticContent(content, isDarkMode);
      }

      if (!shouldShowTyping) {
        return null;
      }

      const codeBlockRegex = /```(jsx|javascript|js)?\n([\s\S]*?)```/g;
      const segments: Array<
        | {
            type: "text";
            content: string;
            delay: number;
          }
        | {
            type: "code";
            content: string;
            language: string;
            delay: number;
          }
      > = [];

      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let totalTextLength = 0;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          const textPart = content.slice(lastIndex, match.index);
          segments.push({
            type: "text",
            content: textPart,
            delay: totalTextLength * 25,
          });
          totalTextLength += textPart.length;
        }

        const codeContent = match[2];
        const language = match[1] || "javascript";
        segments.push({
          type: "code",
          content: codeContent,
          language,
          delay: totalTextLength * 25,
        });
        totalTextLength += codeContent.length;

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < content.length) {
        const remainingText = content.slice(lastIndex);
        segments.push({
          type: "text",
          content: remainingText,
          delay: totalTextLength * 25,
        });
      }

      return (
        <div>
          {segments.map((segment, idx) => {
            const isLast = idx === segments.length - 1;

            if (segment.type === "text") {
              return (
                <TypingText
                  key={`segment-text-${idx}`}
                  text={segment.content}
                  isVisible={shouldShowTyping}
                  speed={25}
                  delay={segment.delay}
                  onComplete={isLast ? handleMessageComplete : undefined}
                />
              );
            }

            return (
              <div key={`segment-code-${idx}`} className="my-2">
                <div className="border border-muted-foreground/25 overflow-hidden rounded-lg code-block">
                  <TypingCodeBlock
                    code={segment.content}
                    language={segment.language}
                    isVisible={shouldShowTyping}
                    speed={15}
                    delay={segment.delay}
                    onComplete={isLast ? handleMessageComplete : undefined}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    [
      completedMessages,
      currentMessageIndex,
      handleMessageComplete,
      isDarkMode,
      isMessageTyping,
    ]
  );

  return (
    <div
      ref={containerRef}
      className="bg-card/30 backdrop-blur-sm border border-ring/30 rounded-2xl p-6 h-[500px] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-ring/30">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">CappyChat Demo</h3>
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
        className="flex-1 overflow-y-hidden space-y-4 [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {DEMO_MESSAGES.map((message, index) => {
          const isCurrentMessage = index === currentMessageIndex;
          const isCompleted = completedMessages.has(index);
          const shouldShow = isCurrentMessage || isCompleted;

          if (!shouldShow) return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className={cn(
                "flex gap-3",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.type === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/20">
                  <CapybaraIcon
                    size="text-xs"
                    animated={false}
                    showLoader={false}
                  />
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
                      isCurrentMessage={isCurrentMessage}
                      isCompleted={isCompleted}
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
                      ? "dark:text-zinc-300 text-muted-foreground"
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/20">
              <CapybaraIcon
                size="text-xs"
                animated={false}
                showLoader={false}
              />
            </div>
            <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="flex gap-2 items-end">
                  CappyChat is thinking{" "}
                  <CapybaraIcon size="text-md" animated showLoader={false} />{" "}
                  ...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {demoFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
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

export default memo(DemoChatComponent);
