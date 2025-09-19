"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Share2,
  Brain,
  Search,
  GitBranch,
  User,
  Bot,
  Check,
  Trash2,
  SendIcon,
  User2,
} from "lucide-react";
import { Ripple } from "./ui/ripple";

interface FeatureGridProps {
  className?: string;
}

const FEATURES = [
  {
    id: "projects-sharing",
    title: "Project & Chat Sharing",
    subtitle: "Collaborate seamlessly",
    icon: Share2,
    description: "Share projects and conversations instantly",
    color: "from-primary/20 to-accent/20",
    iconColor: "text-primary",
    demo: "sharing",
  },
  {
    id: "global-memory",
    title: "Global Memory",
    subtitle: "Remember everything",
    icon: Brain,
    description: "AI that learns and remembers across sessions",
    color: "from-accent/20 to-muted/20",
    iconColor: "text-accent-foreground",
    demo: "memory",
  },
  {
    id: "chat-browsing",
    title: "Chat Browsing",
    subtitle: "Navigate with ease",
    icon: Search,
    description: "Search and browse conversations effortlessly",
    color: "from-primary/20 to-secondary/20",
    iconColor: "text-primary",
    demo: "browsing",
  },
  {
    id: "chat-branching",
    title: "Chat Branching",
    subtitle: "Explore possibilities",
    icon: GitBranch,
    description: "Branch conversations to explore different paths",
    color: "from-muted/20 to-accent/20",
    iconColor: "text-muted-foreground",
    demo: "branching",
  },
] as const;

const UserCircle = React.memo(
  React.forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
  >(({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-10 items-center justify-center rounded-full border-2 bg-background shadow-sm",
        className
      )}
    >
      {children}
    </div>
  ))
);
UserCircle.displayName = "UserCircle";

const StaticBeam = React.memo(
  ({
    fromRef,
    toRef,
    containerRef,
    color = "#B6A296",
  }: {
    fromRef: React.RefObject<HTMLDivElement | null>;
    toRef: React.RefObject<HTMLDivElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    color?: string;
  }) => {
    const [pathData, setPathData] = useState<string>("");

    const updatePath = useCallback(() => {
      if (!fromRef.current || !toRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
      const toX = toRect.left + toRect.width / 2 - containerRect.left;
      const toY = toRect.top + toRect.height / 2 - containerRect.top;

      const midX = (fromX + toX) / 2;
      const path = `M ${fromX} ${fromY} Q ${midX} ${fromY} ${toX} ${toY}`;
      setPathData(path);
    }, [fromRef, toRef, containerRef]);

    useEffect(() => {
      updatePath();

      const resizeObserver = new ResizeObserver(updatePath);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [updatePath]);

    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          opacity={0.4}
        />
      </svg>
    );
  }
);
StaticBeam.displayName = "StaticBeam";

const SharingDemo = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user1Ref = useRef<HTMLDivElement>(null);
  const user2Ref = useRef<HTMLDivElement>(null);
  const user3Ref = useRef<HTMLDivElement>(null);
  const user4Ref = useRef<HTMLDivElement>(null);
  const centralRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-[250px] w-full items-center justify-center overflow-hidden"
    >
      <Ripple className="opacity-25" />

      <div className="flex size-full max-w-xs flex-row items-stretch justify-between gap-8">
        <div className="flex flex-col justify-center">
          <UserCircle
            ref={user1Ref}
            className="border-primary/60 bg-background/80"
          >
            <User2 className="w-6 h-6 text-primary" />
          </UserCircle>
        </div>

        <div className="flex flex-col justify-center">
          <UserCircle
            ref={centralRef}
            className="size-12 border-primary/60 bg-background/80"
          >
            <SendIcon className="w-6 h-6 text-primary" />
          </UserCircle>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <UserCircle
            ref={user2Ref}
            className="border-primary/60 bg-background/80"
          >
            <User2 className="w-6 h-6 text-primary" />
          </UserCircle>
          <UserCircle
            ref={user3Ref}
            className="border-primary/60 bg-background/80"
          >
            <User2 className="w-6 h-6 text-primary" />
          </UserCircle>
          <UserCircle
            ref={user4Ref}
            className="border-primary/60 bg-background/80"
          >
            <User2 className="w-6 h-6 text-primary" />
          </UserCircle>
        </div>
      </div>

      <StaticBeam
        containerRef={containerRef}
        fromRef={user1Ref}
        toRef={centralRef}
        color="#B6A296"
      />
      <StaticBeam
        containerRef={containerRef}
        fromRef={centralRef}
        toRef={user2Ref}
        color="#B6A296"
      />
      <StaticBeam
        containerRef={containerRef}
        fromRef={centralRef}
        toRef={user3Ref}
        color="#B6A296"
      />
      <StaticBeam
        containerRef={containerRef}
        fromRef={centralRef}
        toRef={user4Ref}
        color="#B6A296"
      />

      <motion.div
        className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full px-2 py-1.5 shadow-sm">
          <div className="flex items-center px-2.5">
            <span className="text-xs text-center font-medium text-foreground">
              Share your conversation or project with others
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
SharingDemo.displayName = "SharingDemo";

const MemoryDemo = React.memo(() => {
  const [isEnabled, setIsEnabled] = useState(true);

  const handleToggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  return (
    <div className="w-full h-full bg-background/50 rounded-xl border-ring/15 border flex flex-col p-3 space-y-3">
      <div className="flex items-center justify-between border-b border-ring/15 pb-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Global Memory
          </span>
        </div>

        <button
          className={cn(
            "relative w-8 h-4 rounded-full transition-colors duration-200 border border-border/20",
            isEnabled ? "bg-primary" : "bg-muted/50"
          )}
          onClick={handleToggle}
        >
          <div
            className={cn(
              "absolute w-3 h-3 rounded-full top-0.5 flex items-center justify-center transition-all duration-200",
              isEnabled
                ? "bg-background translate-x-4"
                : "bg-muted-foreground/50 translate-x-0.5"
            )}
          >
            {isEnabled && <Check className="w-2 h-2 text-primary" />}
          </div>
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Allow AI to remember important information across conversations
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Memories stored</span>
        <span className="text-foreground font-medium">2/30 used</span>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-foreground">
          Current Memories
        </h4>

        <motion.div
          className="bg-secondary border border-border rounded-lg p-2 flex items-start justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            I am 25 years old.
          </p>
          <Trash2 className="w-3 h-3 text-muted-foreground/60 shrink-0 ml-2" />
        </motion.div>

        <motion.div
          className="bg-secondary border border-border rounded-lg p-2 flex items-start justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            I am learning french.
          </p>
          <Trash2 className="w-3 h-3 text-muted-foreground/60 shrink-0 ml-2" />
        </motion.div>

        <motion.button
          className="flex items-center gap-1.5 text-xs text-primary border border-border rounded-md px-2 py-1.5 hover:bg-secondary transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Trash2 className="w-3 h-3" />
          Clear All Memories
        </motion.button>
      </div>
    </div>
  );
});
MemoryDemo.displayName = "MemoryDemo";

const BrowsingDemo = React.memo(() => {
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => [
      {
        id: 1,
        type: "user" as const,
        content: "How do I implement authentication in my React app?",
      },
      {
        id: 2,
        type: "assistant" as const,
        content:
          "Authentication can be implemented using JWT tokens or session-based auth. Here's a step-by-step approach: 1) Set up authentication endpoints, 2) Create login/logout functions, 3) Implement protected routes, 4) Store tokens securely...",
      },
      {
        id: 3,
        type: "user" as const,
        content: "What's the best way to handle state management?",
      },
      {
        id: 4,
        type: "assistant" as const,
        content:
          "For state management, you have several excellent options: Context API for simple state, Redux Toolkit for complex applications, or Zustand for a lightweight solution. Consider your app's complexity and team preferences...",
      },
      {
        id: 5,
        type: "user" as const,
        content: "How can I optimize my app's performance?",
      },
      {
        id: 6,
        type: "assistant" as const,
        content:
          "Performance optimization involves multiple strategies: 1) Use React.memo and useMemo for expensive calculations, 2) Implement code splitting with lazy loading, 3) Optimize images and assets, 4) Use proper caching strategies...",
      },
    ],
    []
  );

  const chatSummaries = useMemo(
    () => [
      { id: 1, title: "Authentication Setup", messageIndex: 0 },
      { id: 2, title: "Performance Optimization", messageIndex: 4 },
      { id: 3, title: "State Management", messageIndex: 2 },
    ],
    []
  );

  const handleChatClick = useCallback((messageIndex: number) => {
    setSelectedMessage(messageIndex);

    if (chatContainerRef.current) {
      const messageElement = chatContainerRef.current.children[
        messageIndex
      ] as HTMLElement;
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }
  }, []);

  return (
    <div className="w-full h-full flex gap-2 ">
      <div className="w-1/3 bg-background/50 border-ring/10 border rounded-lg p-2 space-y-1">
        <div className="text-sm border-b border-ring/10 text-center pb-2 text-muted-foreground mb-6 font-medium">
          Chats
        </div>
        <div className="space-y-3 flex item-center flex-col justify-center">
          {chatSummaries.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "p-2 rounded-md text-xs cursor-pointer transition-all duration-200",
                selectedMessage === chat.messageIndex
                  ? "bg-primary/20"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
              onClick={() => handleChatClick(chat.messageIndex)}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="truncate font-medium">{chat.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-background/50 rounded-lg border border-ring/10 p-2">
        <div className="text-sm text-muted-foreground mb-1 p-1.5 border-b border-ring/10 font-medium">
          Chat History
        </div>
        <div
          ref={chatContainerRef}
          className="space-y-3 py-3.5 h-44 overflow-x-hidden overflow-y-auto scrollbar-thin"
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "p-2 rounded-md py-2.5 text-xs transition-all duration-200",
                message.type === "user"
                  ? "bg-primary/10 text-foreground ml-8"
                  : "bg-muted/30 text-muted-foreground mr-8",
                selectedMessage === index && "bg-primary/40"
              )}
            >
              <div className="flex items-start gap-1.5">
                <div className="bg-primary/10 border-ring/20 border rounded-full p-1">
                  {message.type === "user" ? (
                    <User className="w-3 h-3 shrink-0 text-primary" />
                  ) : (
                    <Bot className="w-3 h-3 shrink-0 text-primary" />
                  )}
                </div>
                <div className="line-clamp-3 leading-tight">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
BrowsingDemo.displayName = "BrowsingDemo";

const Circle = React.memo(
  React.forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
  >(({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background p-1.5 shadow-sm",
          className
        )}
      >
        {children}
      </div>
    );
  })
);
Circle.displayName = "Circle";

const BranchingDemo = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const branch1Ref = useRef<HTMLDivElement>(null);
  const branch2Ref = useRef<HTMLDivElement>(null);
  const branch3Ref = useRef<HTMLDivElement>(null);

  const MainIcon = useMemo(
    () => (
      <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
      </div>
    ),
    []
  );

  const BranchIcon = useMemo(
    () => <GitBranch className="w-3 h-3 text-muted-foreground" />,
    []
  );

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden p-2"
      ref={containerRef}
    >
      <div className="flex w-full max-w-sm flex-row items-stretch justify-between gap-6">
        <div className="flex flex-col justify-center">
          <Circle ref={mainRef} className="bg-background/80 border-primary/60">
            {MainIcon}
          </Circle>
          <span className="text-xs text-center mt-1 text-primary font-medium">
            Chat 1
          </span>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div className="flex flex-col items-center">
            <Circle
              ref={branch1Ref}
              className="bg-background/80 border-primary/60"
            >
              {BranchIcon}
            </Circle>
            <span className="text-xs text-center mt-1 text-muted-foreground">
              Branch 1
            </span>
          </div>

          <div className="flex flex-col items-center">
            <Circle
              ref={branch2Ref}
              className="bg-background/80 border-primary/60"
            >
              {BranchIcon}
            </Circle>
            <span className="text-xs text-center mt-1 text-muted-foreground">
              Branch 2
            </span>
          </div>

          <div className="flex flex-col items-center">
            <Circle
              ref={branch3Ref}
              className="bg-background/80 border-primary/60"
            >
              {BranchIcon}
            </Circle>
            <span className="text-xs text-center mt-1 text-muted-foreground">
              Branch 3
            </span>
          </div>
        </div>
      </div>

      <StaticBeam
        containerRef={containerRef}
        fromRef={mainRef}
        toRef={branch1Ref}
      />
      <StaticBeam
        containerRef={containerRef}
        fromRef={mainRef}
        toRef={branch2Ref}
      />
      <StaticBeam
        containerRef={containerRef}
        fromRef={mainRef}
        toRef={branch3Ref}
      />
    </div>
  );
});
BranchingDemo.displayName = "BranchingDemo";

const FeatureCard = React.memo(
  ({
    feature,
    containerVariants,
    isWide,
  }: {
    feature: (typeof FEATURES)[number];
    containerVariants: any;
    isWide: boolean;
  }) => {
    const demoComponents = useMemo(
      () => ({
        sharing: <SharingDemo />,
        memory: <MemoryDemo />,
        browsing: <BrowsingDemo />,
        branching: <BranchingDemo />,
      }),
      []
    );

    return (
      <motion.div
        variants={containerVariants}
        className={cn(
          "relative group bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10 backdrop-blur-md ring ring-ring/20 rounded-2xl pt-6 overflow-hidden transition-all duration-300",
          isWide ? "md:col-span-2" : "col-span-1"
        )}
        whileHover={{ y: -2 }}
      >
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center px-6 gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.subtitle}
              </p>
            </div>
          </div>

          <div
            className={`flex-1 flex items-center justify-center min-h-[80px] ${
              feature.demo === "sharing" ? "pb-0" : "pb-6 px-6"
            }`}
          >
            {demoComponents[feature.demo as keyof typeof demoComponents]}
          </div>
        </div>
      </motion.div>
    );
  }
);
FeatureCard.displayName = "FeatureCard";

export default function FeatureGrid({ className }: FeatureGridProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut",
        },
      },
    }),
    []
  );

  const gridVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    }),
    []
  );

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      variants={gridVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <FeatureCard
          feature={FEATURES[0]}
          containerVariants={containerVariants}
          isWide={true}
        />
        <FeatureCard
          feature={FEATURES[1]}
          containerVariants={containerVariants}
          isWide={false}
        />
        <FeatureCard
          feature={FEATURES[3]}
          containerVariants={containerVariants}
          isWide={false}
        />
        <FeatureCard
          feature={FEATURES[2]}
          containerVariants={containerVariants}
          isWide={true}
        />
      </div>
    </motion.div>
  );
}
