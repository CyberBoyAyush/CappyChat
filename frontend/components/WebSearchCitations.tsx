import React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSearchCitationsProps {
  results: string[];
  searchQuery?: string;
  className?: string;
}

export function WebSearchCitations({
  results,
  searchQuery = "search query",
  className
}: WebSearchCitationsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className={cn("mt-6 pt-4 border-t border-border/30", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20">
          <Globe className="h-3 w-3 text-red-500" />
        </div>
        <span className="text-sm font-medium text-foreground">
          Web Search Results for "{searchQuery}"
        </span>
      </div>

      {/* Simple Results Grid - Just Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((url, index) => {
          try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');

            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex flex-col p-3 rounded-lg border border-border/50 bg-card/30",
                  "hover:border-border hover:bg-card/50 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              >
                {/* Domain as title */}
                <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                  {domain}
                </h3>

                {/* URL */}
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {url}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-end mt-auto">
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Visit →
                  </span>
                </div>
              </a>
            );
          } catch {
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-card/30",
                  "hover:border-border hover:bg-card/50 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              >
                <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-sm text-foreground group-hover:text-blue-600 transition-colors truncate">
                  {url}
                </span>
              </a>
            );
          }
        })}
      </div>
    </div>
  );
}

export default WebSearchCitations;
