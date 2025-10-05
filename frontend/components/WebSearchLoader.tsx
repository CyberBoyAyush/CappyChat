/**
 * WebSearchLoader Component
 *
 * Purpose: Shows a loading animation when web search is in progress.
 * Displays a search toolkit interface and detects which tool is being called.
 */

import React, { useMemo } from 'react';
import { Search, Globe, Clock, CloudRain, Link2, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSearchLoaderProps {
  searchQuery?: string;
  className?: string;
}

// Detect which tool is likely being called based on query
function detectTool(query: string): {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
} {
  const lowerQuery = query.toLowerCase();

  // Weather detection
  if (
    lowerQuery.includes('weather') ||
    lowerQuery.includes('temperature') ||
    lowerQuery.includes('forecast') ||
    lowerQuery.includes('climate') ||
    lowerQuery.match(/\b(hot|cold|rain|snow|sunny|cloudy)\b/)
  ) {
    return {
      name: 'Weather Tool',
      icon: <CloudRain className="h-4 w-4" />,
      description: 'Fetching current weather data...',
      color: 'text-blue-500',
    };
  }

  // Retrieval detection (URL or domain queries)
  if (
    lowerQuery.match(/what is .+\.(com|org|net|io|ai|dev|xyz)/i) ||
    lowerQuery.includes('website') ||
    lowerQuery.includes('domain') ||
    lowerQuery.match(/https?:\/\//i)
  ) {
    return {
      name: 'Retrieval Tool',
      icon: <Link2 className="h-4 w-4" />,
      description: 'Crawling website content...',
      color: 'text-purple-500',
    };
  }

  // Greeting detection
  if (
    lowerQuery.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/i) &&
    lowerQuery.split(' ').length <= 3
  ) {
    return {
      name: 'Greeting Tool',
      icon: <Hand className="h-4 w-4" />,
      description: 'Preparing response...',
      color: 'text-green-500',
    };
  }

  // Default: Web Search
  return {
    name: 'Web Search Tool',
    icon: <Globe className="h-4 w-4" />,
    description: 'Searching the web for relevant information...',
    color: 'text-primary',
  };
}

export function WebSearchLoader({
  searchQuery = "search query",
  className
}: WebSearchLoaderProps) {
  const tool = useMemo(() => detectTool(searchQuery), [searchQuery]);

  return (
    <div className={cn(
      "flex flex-col gap-4 p-6 bg-card/40 border border-border/50 rounded-xl",
      "animate-pulse",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg border",
          "bg-primary/10 border-primary/20"
        )}>
          <Search className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className={tool.color}>{tool.icon}</span>
            {tool.name}
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          </h3>
        </div>
      </div>

      {/* Search Query */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        <span className="font-medium">Query</span>
      </div>
      <div className="bg-background/50 border border-border/30 rounded-lg p-3">
        <p className="text-sm text-foreground font-medium">"{searchQuery}"</p>
      </div>

      {/* Loading Animation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3.5 w-3.5 animate-spin" />
        <span>{tool.description}</span>
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
