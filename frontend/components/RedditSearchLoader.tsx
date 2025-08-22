/**
 * RedditSearchLoader Component
 *
 * Purpose: Shows a loading animation when Reddit search is in progress.
 * Displays a Reddit-themed search toolkit interface.
 */

import React from 'react';
import { Search, MessageSquare, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RedditSearchLoaderProps {
  searchQuery?: string;
  className?: string;
}

export function RedditSearchLoader({ 
  searchQuery = "search query", 
  className 
}: RedditSearchLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col gap-4 p-6 bg-card/40 border border-border/50 rounded-xl",
      "animate-pulse",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20">
          <Search className="h-4 w-4 text-black dark:text-white animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-black dark:text-white" />
            Reddit Search Toolkit
            <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-ping" />
          </h3>
        </div>
      </div>

      {/* Search Query */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        <span className="font-medium">Search Query</span>
      </div>
      <div className="bg-background/50 border border-border/30 rounded-lg p-3">
        <p className="text-sm text-foreground font-medium">"{searchQuery}"</p>
      </div>

      {/* Reddit-specific features */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>Searching Reddit communities and discussions...</span>
      </div>

      {/* Loading Animation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5 animate-spin" />
        <span>Finding relevant posts, comments, and community insights...</span>
      </div>

      {/* Reddit-themed info */}
      <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-3">
        <div className="flex items-center gap-2 text-xs text-black dark:text-white">
          <MessageSquare className="h-3 w-3" />
          <span className="font-medium">Searching across Reddit communities</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Finding discussions, user experiences, and community opinions
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default RedditSearchLoader;
