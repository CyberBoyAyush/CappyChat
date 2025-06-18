/**
 * GlobalSearchDialog Component
 *
 * Purpose: Enhanced global search dialog with glassy effect and advanced search capabilities.
 * Features fuzzy search, search highlighting, intelligent scoring, and modern glass morphism UI.
 * Triggered by Cmd+K (Mac) or Ctrl+Shift+K (Windows/Linux) keyboard shortcuts.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  Search,
  X,
  MessageSquare,
  Hash,
  ArrowRight,
  Sparkles,
  Tag,
  User,
  Bot,
} from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/lib/utils";
import { HybridDB } from "@/lib/hybridDB";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { ScrollArea } from "@/frontend/components/ui/scroll-area";
import { Badge } from "@/frontend/components/ui/BasicComponents";

interface SearchResult {
  id: string;
  type: "thread" | "message" | "summary";
  title: string;
  content: string;
  threadId: string;
  threadTitle: string;
  timestamp: string;
  tags?: string[];
  messageRole?: "user" | "assistant" | "system" | "data";
  score: number; // Search relevance score
  highlights?: {
    title?: string;
    content?: string;
  };
}

// Fuzzy search utility functions
const fuzzyScore = (query: string, text: string): number => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 100;

  // Check if query is contained in text
  if (textLower.includes(queryLower)) {
    const position = textLower.indexOf(queryLower);
    const lengthRatio = queryLower.length / textLower.length;
    const positionScore = 1 - position / textLower.length;
    return 80 + lengthRatio * 15 + positionScore * 5;
  }

  // Fuzzy matching - check if all characters of query exist in order
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
      consecutiveMatches++;
      score += consecutiveMatches * 2; // Bonus for consecutive matches
    } else {
      consecutiveMatches = 0;
    }
  }

  if (queryIndex === queryLower.length) {
    const completionRatio = queryIndex / queryLower.length;
    const lengthPenalty = Math.max(
      0,
      1 - (textLower.length - queryLower.length) / 100
    );
    return Math.min(75, score * completionRatio * lengthPenalty);
  }

  return 0;
};

const highlightText = (text: string, query: string): string => {
  if (!query.trim()) return text;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);

  if (index === -1) return text;

  return (
    text.substring(0, index) +
    '<mark class="bg-primary/20 text-foreground dark:text-primary-foreground rounded px-0.5">' +
    text.substring(index, index + query.length) +
    "</mark>" +
    text.substring(index + query.length)
  );
};

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchDialog({
  isOpen,
  onClose,
}: GlobalSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Inject the global styles for custom scrollbar
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(127, 127, 127, 0.5);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(127, 127, 127, 0.8);
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(127, 127, 127, 0.5) transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform comprehensive enhanced search with fuzzy matching and scoring
  const performSearch = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (!query.trim() || !user) {
        return [];
      }

      const results: SearchResult[] = [];
      const minScore = 10; // Minimum score threshold

      try {
        // Get all threads for the user
        const threads = HybridDB.getThreads();

        for (const thread of threads) {
          // Search in thread titles with fuzzy scoring
          const titleScore = fuzzyScore(query, thread.title);
          if (titleScore >= minScore) {
            results.push({
              id: `thread-${thread.id}`,
              type: "thread",
              title: thread.title,
              content: thread.title,
              threadId: thread.id,
              threadTitle: thread.title,
              timestamp: (thread.updatedAt || thread.createdAt).toString(),
              tags: thread.tags,
              score: titleScore + 10, // Bonus for thread title matches
              highlights: {
                title: highlightText(thread.title, query),
                content: highlightText(thread.title, query),
              },
            });
          }

          // Search in thread tags
          if (thread.tags) {
            const matchingTags: string[] = [];
            let maxTagScore = 0;

            for (const tag of thread.tags) {
              const tagScore = fuzzyScore(query, tag);
              if (tagScore >= minScore) {
                matchingTags.push(tag);
                maxTagScore = Math.max(maxTagScore, tagScore);
              }
            }

            if (matchingTags.length > 0) {
              const tagTitle = `Tags: ${matchingTags.join(", ")}`;
              results.push({
                id: `thread-tags-${thread.id}`,
                type: "thread",
                title: tagTitle,
                content: thread.title,
                threadId: thread.id,
                threadTitle: thread.title,
                timestamp: (thread.updatedAt || thread.createdAt).toString(),
                tags: matchingTags,
                score: maxTagScore + 5, // Bonus for tag matches
                highlights: {
                  title: highlightText(tagTitle, query),
                  content: highlightText(thread.title, query),
                },
              });
            }
          }

          // Search in message summaries
          try {
            const summaries = await HybridDB.getMessageSummariesWithRole(
              thread.id
            );
            for (const summary of summaries) {
              const summaryScore = fuzzyScore(query, summary.content);
              if (summaryScore >= minScore) {
                const preview =
                  summary.content.length > 150
                    ? summary.content.substring(0, 150) + "..."
                    : summary.content;

                results.push({
                  id: `summary-${summary.messageId}`,
                  type: "summary",
                  title: preview,
                  content: summary.content,
                  threadId: thread.id,
                  threadTitle: thread.title,
                  timestamp: summary.createdAt,
                  messageRole: summary.role,
                  score: summaryScore,
                  highlights: {
                    title: highlightText(preview, query),
                    content: highlightText(summary.content, query),
                  },
                });
              }
            }
          } catch (error) {
            console.error(
              "Error searching summaries for thread:",
              thread.id,
              error
            );
          }

          // Search in actual messages (limited to recent ones for performance)
          try {
            const messages = HybridDB.getMessagesByThreadId(thread.id);
            const recentMessages = messages.slice(-50); // Only search recent 50 messages per thread

            for (const message of recentMessages) {
              const messageScore = fuzzyScore(query, message.content);
              if (messageScore >= minScore) {
                const preview =
                  message.content.length > 120
                    ? message.content.substring(0, 120) + "..."
                    : message.content;

                results.push({
                  id: `message-${message.id}`,
                  type: "message",
                  title: preview,
                  content: message.content,
                  threadId: thread.id,
                  threadTitle: thread.title,
                  timestamp: message.createdAt.toISOString(),
                  messageRole: message.role as
                    | "user"
                    | "assistant"
                    | "system"
                    | "data",
                  score: messageScore,
                  highlights: {
                    title: highlightText(preview, query),
                    content: highlightText(message.content, query),
                  },
                });
              }
            }
          } catch (error) {
            console.error(
              "Error searching messages for thread:",
              thread.id,
              error
            );
          }
        }

        // Enhanced sorting by score, type priority, and recency
        return results
          .sort((a, b) => {
            // First, sort by score (higher is better)
            if (Math.abs(a.score - b.score) > 5) {
              return b.score - a.score;
            }

            // Then by type priority (threads > summaries > messages)
            const typePriority = { thread: 3, summary: 2, message: 1 };
            const aPriority = typePriority[a.type];
            const bPriority = typePriority[b.type];
            if (aPriority !== bPriority) {
              return bPriority - aPriority;
            }

            // Finally by timestamp (most recent first)
            return (
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          })
          .slice(0, 30); // Limit to 30 high-quality results
      } catch (error) {
        console.error("Search error:", error);
        return [];
      }
    },
    [user]
  );

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (query: string) => {
      clearTimeout(timeoutId);

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await performSearch(query);
          setSearchResults(results);
          setSelectedIndex(0);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 200); // Faster response for better UX
    };
  }, [performSearch]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      navigate(`/chat/${result.threadId}`);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, searchResults.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && searchResults[selectedIndex]) {
        e.preventDefault();
        handleResultSelect(searchResults[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [searchResults, selectedIndex, handleResultSelect, onClose]
  );

  const getResultIcon = (type: SearchResult["type"], role?: string) => {
    if (type === "thread") return <Hash className="h-4 w-4 text-primary" />;
    if (type === "message") {
      switch (role) {
        case "user":
          return <User className="h-4 w-4 text-blue-500" />;
        case "assistant":
          return <Bot className="h-4 w-4 text-green-500" />;
        case "system":
          return <MessageSquare className="h-4 w-4 text-orange-500" />;
        default:
          return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      }
    }
    return <Sparkles className="h-4 w-4 text-purple-500" />;
  };

  const getResultTypeLabel = (type: SearchResult["type"], role?: string) => {
    if (type === "thread") return "Thread";
    if (type === "message") {
      switch (role) {
        case "user":
          return "Your message";
        case "assistant":
          return "AI response";
        case "system":
          return "System";
        case "data":
          return "Data";
        default:
          return "Message";
      }
    }
    return "Summary";
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl lg:max-w-3xl max-h-[65vh] sm:max-h-[60vh] md:max-h-[75vh] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="hidden sm:inline">Search Everything</span>
            <span className="sm:hidden">Search</span>
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            <span className="hidden sm:inline">
              Find anything across your conversations with intelligent search
            </span>
            <span className="sm:hidden">Find across conversations</span>
          </p>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4">
          <div className="relative group">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary " />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search threads, messages, summaries..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-12 sm:h-14 text-sm sm:text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-card/70 transition-all duration-200 rounded-xl"
            />
            {isSearching && (
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
            {searchQuery && !isSearching && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
          {searchResults.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 mt-4">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className={cn(
                    "group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200",
                    "bg-card/30 backdrop-blur-sm border border-border/30 hover:border-primary/30",
                    "hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5",
                    index === selectedIndex &&
                      "bg-primary/5 border-primary/50 shadow-lg shadow-primary/10"
                  )}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getResultIcon(result.type, result.messageRole)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium bg-primary/10 text-primary border-primary/20"
                      >
                        {getResultTypeLabel(result.type, result.messageRole)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(result.timestamp)}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            result.score >= 80
                              ? "bg-green-500"
                              : result.score >= 60
                              ? "bg-yellow-500"
                              : result.score >= 40
                              ? "bg-orange-500"
                              : "bg-red-500"
                          )}
                        />
                        <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                          {Math.round(result.score)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="font-medium text-sm mb-2 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: result.highlights?.title || result.title,
                      }}
                    />

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 min-w-0">
                        <Hash className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{result.threadTitle}</span>
                      </p>

                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {result.tags
                            .slice(0, window.innerWidth < 640 ? 1 : 2)
                            .map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                              >
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                <span className="max-w-16 truncate">{tag}</span>
                              </Badge>
                            ))}
                          {result.tags.length >
                            (window.innerWidth < 640 ? 1 : 2) && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0.5"
                            >
                              +
                              {result.tags.length -
                                (window.innerWidth < 640 ? 1 : 2)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">
                No results found
              </h3>
              <p className="text-sm px-2">
                No matches for{" "}
                <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs sm:text-sm break-all">
                  "{searchQuery}"
                </span>
              </p>
              <p className="text-xs mt-2 opacity-75">
                Try different keywords or check your spelling
              </p>
            </div>
          ) : searchQuery && isSearching ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">
                Searching...
              </h3>
              <p className="text-sm px-2">
                Looking through conversations for{" "}
                <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs sm:text-sm break-all">
                  "{searchQuery}"
                </span>
              </p>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-muted-foreground px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary/70" />
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-2">
                Search Everything
              </h3>
              <p className="text-sm mb-4 px-2">
                <span className="hidden sm:inline">
                  Find threads, messages, summaries, and tags instantly
                </span>
                <span className="sm:hidden">Find across conversations</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs mb-4">
                <Badge variant="outline" className="bg-card/50">
                  <Hash className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Threads</span>
                  <span className="sm:hidden">T</span>
                </Badge>
                <Badge variant="outline" className="bg-card/50">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Messages</span>
                  <span className="sm:hidden">M</span>
                </Badge>
                <Badge variant="outline" className="bg-card/50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Summaries</span>
                  <span className="sm:hidden">S</span>
                </Badge>
                <Badge variant="outline" className="bg-card/50">
                  <Tag className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Tags</span>
                  <span className="sm:hidden">Tags</span>
                </Badge>
              </div>
              <div className="hidden sm:flex justify-center gap-4 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-xs">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-xs">
                    Enter
                  </kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-xs">
                    Esc
                  </kbd>
                  Close
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
