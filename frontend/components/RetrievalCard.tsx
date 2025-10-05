/**
 * RetrievalCard Component
 * 
 * Displays website metadata from retrieval tool results
 * Shows favicon, title, banner image, and summary
 */

import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RetrievalCardData {
  url: string;
  title: string;
  favicon?: string;
  image?: string;
  summary?: string;
}

interface RetrievalCardProps {
  data: RetrievalCardData;
  className?: string;
}

export function RetrievalCard({ data, className }: RetrievalCardProps) {
  const domain = new URL(data.url).hostname.replace('www.', '');
  
  return (
    <div className={cn(
      "flex flex-col gap-3 p-4 bg-card/40 border border-border/50 rounded-xl mb-4",
      "hover:bg-card/60 transition-colors",
      className
    )}>
      {/* Banner Image */}
      {data.image && (
        <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
          <img 
            src={data.image} 
            alt={data.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Header with Favicon and Title */}
      <div className="flex items-start gap-3">
        {data.favicon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-background border border-border/50 flex items-center justify-center overflow-hidden">
            <img 
              src={data.favicon} 
              alt=""
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {data.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">4.9s</span>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      {data.summary && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {data.summary}
        </p>
      )}
      
      {/* View Source Link */}
      <a 
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" />
        View source
        <span className="ml-auto text-muted-foreground">{domain}</span>
      </a>
    </div>
  );
}

/**
 * Extract retrieval card data from message content
 */
export function extractRetrievalCard(content: string): {
  data: RetrievalCardData | null;
  cleanContent: string;
} {
  const match = content.match(/<!-- RETRIEVAL_CARD: ({.*?}) -->/);
  
  if (!match) {
    return { data: null, cleanContent: content };
  }
  
  try {
    const data = JSON.parse(match[1]) as RetrievalCardData;
    const cleanContent = content.replace(/<!-- RETRIEVAL_CARD: {.*?} -->/, '').trim();
    return { data, cleanContent };
  } catch (error) {
    console.error('Failed to parse retrieval card data:', error);
    return { data: null, cleanContent: content };
  }
}

export default RetrievalCard;

