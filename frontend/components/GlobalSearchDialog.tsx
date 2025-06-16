/**
 * GlobalSearchDialog Component
 *
 * Purpose: Global search dialog that allows users to search across all threads, messages, and summaries.
 * Triggered by Cmd+K (Mac) or Ctrl+Shift+K (Windows/Linux) keyboard shortcuts.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Search, X, MessageSquare, Hash, Clock, ArrowRight } from "lucide-react";
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
  type: 'thread' | 'message' | 'summary';
  title: string;
  content: string;
  threadId: string;
  threadTitle: string;
  timestamp: string;
  tags?: string[];
  messageRole?: 'user' | 'assistant' | 'system' | 'data';
}

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Perform comprehensive search
  const performSearch = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (!query.trim() || !user) {
        return [];
      }

      const lowerQuery = query.toLowerCase();
      const results: SearchResult[] = [];

      try {
        // Get all threads for the user
        const threads = await HybridDB.getThreads();
        
        for (const thread of threads) {
          // Search in thread titles
          if (thread.title.toLowerCase().includes(lowerQuery)) {
            results.push({
              id: `thread-${thread.id}`,
              type: 'thread',
              title: thread.title,
              content: thread.title,
              threadId: thread.id,
              threadTitle: thread.title,
              timestamp: (thread.updatedAt || thread.createdAt).toString(),
              tags: thread.tags,
            });
          }

          // Search in thread tags
          if (thread.tags && thread.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
            const matchingTags = thread.tags.filter(tag => tag.toLowerCase().includes(lowerQuery));
            results.push({
              id: `thread-tags-${thread.id}`,
              type: 'thread',
              title: `Tags: ${matchingTags.join(', ')}`,
              content: thread.title,
              threadId: thread.id,
              threadTitle: thread.title,
              timestamp: (thread.updatedAt || thread.createdAt).toString(),
              tags: matchingTags,
            });
          }

          // Search in message summaries
          try {
            const summaries = await HybridDB.getMessageSummariesWithRole(thread.id);
            for (const summary of summaries) {
              if (summary.content.toLowerCase().includes(lowerQuery)) {
                results.push({
                  id: `summary-${summary.messageId}`,
                  type: 'summary',
                  title: summary.content,
                  content: summary.content,
                  threadId: thread.id,
                  threadTitle: thread.title,
                  timestamp: summary.createdAt,
                  messageRole: summary.role,
                });
              }
            }
          } catch (error) {
            console.error("Error searching summaries for thread:", thread.id, error);
          }

          // Search in actual messages (limited to recent ones for performance)
          try {
            const messages = HybridDB.getMessagesByThreadId(thread.id);
            const recentMessages = messages.slice(-50); // Only search recent 50 messages per thread
            
            for (const message of recentMessages) {
              if (message.content.toLowerCase().includes(lowerQuery)) {
                const preview = message.content.length > 100 
                  ? message.content.substring(0, 100) + "..."
                  : message.content;
                
                results.push({
                  id: `message-${message.id}`,
                  type: 'message',
                  title: preview,
                  content: message.content,
                  threadId: thread.id,
                  threadTitle: thread.title,
                  timestamp: message.createdAt.toISOString(),
                  messageRole: message.role as 'user' | 'assistant' | 'system' | 'data',
                });
              }
            }
          } catch (error) {
            console.error("Error searching messages for thread:", thread.id, error);
          }
        }

        // Sort results by relevance and recency
        return results
          .sort((a, b) => {
            // Prioritize exact matches in titles
            const aExactMatch = a.title.toLowerCase() === lowerQuery;
            const bExactMatch = b.title.toLowerCase() === lowerQuery;
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;

            // Then by timestamp (most recent first)
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          })
          .slice(0, 50); // Limit to 50 results
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
      }, 300);
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
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
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

  const getResultIcon = (type: SearchResult['type'], role?: string) => {
    if (type === 'thread') return <Hash className="h-4 w-4" />;
    if (type === 'message') {
      return <MessageSquare className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getResultTypeLabel = (type: SearchResult['type'], role?: string) => {
    if (type === 'thread') return 'Thread';
    if (type === 'message') {
      switch (role) {
        case 'user': return 'Your message';
        case 'assistant': return 'AI response';
        case 'system': return 'System message';
        case 'data': return 'Data message';
        default: return 'Message';
      }
    }
    return 'Summary';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Search Everything</DialogTitle>
        </DialogHeader>
        
        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search threads, messages, and summaries..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 h-12 text-base"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96 px-6 pb-6">
          {searchResults.length > 0 ? (
            <div className="space-y-2 mt-4">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    "hover:bg-muted/50",
                    index === selectedIndex && "bg-muted"
                  )}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                    {getResultIcon(result.type, result.messageRole)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {getResultTypeLabel(result.type, result.messageRole)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(result.timestamp)}
                      </span>
                    </div>
                    
                    <p className="font-medium text-sm line-clamp-1 mb-1">
                      {result.title}
                    </p>
                    
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      in {result.threadTitle}
                    </p>
                    
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : searchQuery && isSearching ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p>Searching...</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Start typing to search across all your conversations</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
