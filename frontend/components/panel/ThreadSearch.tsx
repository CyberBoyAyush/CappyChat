/**
 * ThreadSearch Component
 *
 * Used in: frontend/components/panel/PanelComponents.tsx
 * Purpose: Provides search functionality for threads based on titles, message summaries, and tags.
 * Allows users to quickly find specific conversations.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Tag,
  Hash,
  AlignJustify,
  Ellipsis,
  EllipsisVertical,
} from "lucide-react";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/lib/utils";
import { ThreadData } from "./ThreadManager";
import { HybridDB } from "@/lib/hybridDB";
import { useTheme } from "next-themes";

interface ThreadSearchProps {
  threads: ThreadData[];
  onFilteredThreadsChange: (filteredThreads: ThreadData[]) => void;
  className?: string;
}

export const ThreadSearch = ({
  threads,
  onFilteredThreadsChange,
  className,
}: ThreadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Extract all unique tags from threads
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    threads.forEach((thread) => {
      if (thread.tags && thread.tags.length > 0) {
        thread.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [threads]);

  // Perform search across threads, summaries, and tags
  const performSearch = useCallback(
    async (query: string): Promise<ThreadData[]> => {
      if (!query.trim()) {
        return threads;
      }

      const lowerQuery = query.toLowerCase();
      const filteredThreads: ThreadData[] = [];

      for (const thread of threads) {
        let isMatch = false;

        // Search in thread title
        if (thread.title.toLowerCase().includes(lowerQuery)) {
          isMatch = true;
        }

        // Search in thread tags
        if (!isMatch && thread.tags) {
          isMatch = thread.tags.some((tag) =>
            tag.toLowerCase().includes(lowerQuery)
          );
        }

        // Search in message summaries
        if (!isMatch) {
          try {
            const summaries = await HybridDB.getMessageSummariesWithRole(
              thread.id
            );
            isMatch = summaries.some((summary) =>
              summary.content.toLowerCase().includes(lowerQuery)
            );
          } catch (error) {
            console.error(
              "Error searching summaries for thread:",
              thread.id,
              error
            );
          }
        }

        if (isMatch) {
          filteredThreads.push(thread);
        }
      }

      return filteredThreads;
    },
    [threads]
  );

  // Debounced search effect
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (query: string) => {
      clearTimeout(timeoutId);

      // If query is empty, return all threads immediately
      if (!query.trim()) {
        onFilteredThreadsChange(threads);
        setIsSearching(false);
        return;
      }

      timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const filtered = await performSearch(query);
          onFilteredThreadsChange(filtered);
        } catch (error) {
          console.error("Search error:", error);
          onFilteredThreadsChange(threads);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    };
  }, [performSearch, onFilteredThreadsChange, threads]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    onFilteredThreadsChange(threads);
  }, [onFilteredThreadsChange, threads]);

  // Handle focus on search input
  const handleSearchFocus = () => {
    setIsDialogOpen(true);
  };

  // Handle selecting a quick search option
  const handleQuickSearchSelect = (term: string) => {
    setSearchQuery(term);
    debouncedSearch(term);
    setIsDialogOpen(false);
    searchInputRef.current?.focus();
  };

  // Handle tags dropdown toggle
  const handleTagsDropdownToggle = () => {
    setIsTagsDropdownOpen(!isTagsDropdownOpen);
  };

  // Handle tag selection from dropdown
  const handleTagSelect = (tag: string) => {
    setSearchQuery(tag);
    debouncedSearch(tag);
    setIsTagsDropdownOpen(false);
    searchInputRef.current?.focus();
  };

  // Close dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setIsDialogOpen(false);
      }

      if (
        tagsDropdownRef.current &&
        !tagsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTagsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate a consistent color for each tag based on tag name
  const getTagColor = (tag: string) => {
    const colors = ["bg-primary/20 text-primary border-primary/30"];
    // Simple hash function to get consistent color for same tag
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = ((hash << 5) - hash + tag.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search your chat.."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          className="pl-10 pr-10 h-9 sm:h-9 text-sm w-full"
        />

        <div className="w-full bg-foreground/20 h-[1px] mt-1"></div>

        {searchQuery && !isSearching ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        ) : allTags.length > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTagsDropdownToggle}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <EllipsisVertical className="h-3 w-3" />
          </Button>
        ) : null}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Tags Dropdown */}
      {isTagsDropdownOpen && allTags.length > 0 && (
        <div
          ref={tagsDropdownRef}
          className={cn(
            "absolute z-10 mt-1 w-full rounded-md border shadow-md",
            "bg-background border-border",
            "animate-in fade-in-50 zoom-in-95 slide-in-from-top-2",
            "max-h-[200px] overflow-y-auto"
          )}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setIsTagsDropdownOpen(false)}
            aria-label="Close tags dropdown"
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Tags Section */}
          <div className="p-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2 px-2">
              <Tag className="h-3 w-3" />
              <span>All Tags</span>
            </div>
            <div className="flex flex-wrap gap-2 px-2">
              {allTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => handleTagSelect(tag)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border",
                    getTagColor(tag),
                    "hover:opacity-80 transition-opacity"
                  )}
                >
                  <Hash className="h-2.5 w-2.5" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
