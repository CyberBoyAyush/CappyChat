/**
 * ThreadSearch Component
 *
 * Used in: frontend/components/panel/PanelComponents.tsx
 * Purpose: Provides search functionality for threads based on titles, message summaries, and tags.
 * Allows users to quickly find specific conversations.
 */

import { useState, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/frontend/components/ui/input';
import { Button } from '@/frontend/components/ui/button';
import { cn } from '@/lib/utils';
import { ThreadData } from './ThreadManager';
import { HybridDB } from '@/lib/hybridDB';

interface ThreadSearchProps {
  threads: ThreadData[];
  onFilteredThreadsChange: (filteredThreads: ThreadData[]) => void;
  className?: string;
}

export const ThreadSearch = ({ threads, onFilteredThreadsChange, className }: ThreadSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Perform search across threads, summaries, and tags
  const performSearch = useCallback(async (query: string): Promise<ThreadData[]> => {
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
        isMatch = thread.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      }

      // Search in message summaries
      if (!isMatch) {
        try {
          const summaries = await HybridDB.getMessageSummariesWithRole(thread.id);
          isMatch = summaries.some(summary => 
            summary.content.toLowerCase().includes(lowerQuery)
          );
        } catch (error) {
          console.error('Error searching summaries for thread:', thread.id, error);
        }
      }

      if (isMatch) {
        filteredThreads.push(thread);
      }
    }

    return filteredThreads;
  }, [threads]);

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
          console.error('Search error:', error);
          onFilteredThreadsChange(threads);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    };
  }, [performSearch, onFilteredThreadsChange, threads]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    onFilteredThreadsChange(threads);
  }, [onFilteredThreadsChange, threads]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-10 h-11 sm:h-12 text-sm w-full rounded-lg"
        />
        {searchQuery && !isSearching && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
};
