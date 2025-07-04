/**
 * WebSearchLoader Component
 *
 * Purpose: Shows a loading animation when web search is in progress.
 * Displays a search toolkit interface similar to the user's reference image.
 */

import React from 'react';
import { Search, Globe, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSearchLoaderProps {
  searchQuery?: string;
  className?: string;
}

export function WebSearchLoader({ 
  searchQuery = "search query", 
  className 
}: WebSearchLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col gap-4 p-6 bg-card/40 border border-border/50 rounded-xl",
      "animate-pulse",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
          <Search className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Web Search Toolkit
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
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

      {/* Loading Animation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5 animate-spin" />
        <span>Searching the web for relevant information...</span>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default WebSearchLoader;
