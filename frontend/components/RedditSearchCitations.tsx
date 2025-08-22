/**
 * RedditSearchCitations Component
 *
 * Purpose: Displays Reddit search results as citations below assistant messages.
 * Shows clickable Reddit URLs with Reddit-specific styling and metadata.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, Users, ArrowUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitationData {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  favicon?: string;
  isLoading: boolean;
  subreddit?: string;
  postType?: 'post' | 'comment' | 'discussion';
}

interface RedditSearchCitationsProps {
  results: string[];
  searchQuery?: string;
  className?: string;
  isStreaming?: boolean;
}

// Helper function to extract Reddit-specific metadata from URL
const extractRedditMetadata = (url: string) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    let subreddit = '';
    let postType: 'post' | 'comment' | 'discussion' = 'discussion';
    
    if (pathParts[0] === 'r' && pathParts[1]) {
      subreddit = pathParts[1];
      
      if (pathParts[2] === 'comments') {
        postType = 'post';
      } else if (urlObj.pathname.includes('/comments/')) {
        postType = 'comment';
      }
    }
    
    return { subreddit, postType };
  } catch {
    return { subreddit: '', postType: 'discussion' as const };
  }
};

// Mock function to fetch URL metadata (in a real app, you'd call an API)
const fetchUrlMetadata = async (url: string): Promise<Partial<CitationData>> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const { subreddit, postType } = extractRedditMetadata(url);
  
  // Generate mock titles based on subreddit and post type
  const mockTitles: Record<string, string[]> = {
    'AskReddit': [
      'What\'s the most interesting thing you\'ve learned recently?',
      'People who work night shifts, what\'s the weirdest thing you\'ve experienced?',
      'What\'s a skill everyone should learn?'
    ],
    'technology': [
      'New breakthrough in AI technology announced',
      'Discussion: The future of web development',
      'How this new framework is changing everything'
    ],
    'programming': [
      'Best practices for clean code',
      'Help with debugging this issue',
      'What programming language should I learn first?'
    ]
  };
  
  const titles = mockTitles[subreddit] || [
    `Discussion in r/${subreddit}`,
    `Popular post from r/${subreddit}`,
    `Community discussion about the topic`
  ];
  
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  return {
    title,
    description: `${postType === 'post' ? 'Post' : postType === 'comment' ? 'Comment thread' : 'Discussion'} from r/${subreddit}`,
    subreddit,
    postType,
    favicon: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png'
  };
};

export function RedditSearchCitations({
  results,
  searchQuery = "search query",
  className,
  isStreaming = false
}: RedditSearchCitationsProps) {
  const [citations, setCitations] = useState<CitationData[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert URLs to citation data with metadata
  useEffect(() => {
    console.log('🔗 RedditSearchCitations received results:', results);
    if (!results || results.length === 0) return;

    const initialCitations: CitationData[] = results.map(url => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const { subreddit, postType } = extractRedditMetadata(url);
        return {
          url,
          domain,
          subreddit,
          postType,
          isLoading: true
        };
      } catch {
        return {
          url,
          domain: url,
          isLoading: true
        };
      }
    });

    setCitations(initialCitations);

    // Fetch metadata for each URL
    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);

      const updatedCitations = await Promise.all(
        initialCitations.map(async (citation) => {
          try {
            const metadata = await fetchUrlMetadata(citation.url);
            return {
              ...citation,
              ...metadata,
              isLoading: false
            };
          } catch {
            return {
              ...citation,
              isLoading: false
            };
          }
        })
      );

      setCitations(updatedCitations);
      setIsLoadingMetadata(false);
    };

    // Add a small delay to avoid too many rapid requests
    const timer = setTimeout(fetchMetadata, 500);
    return () => clearTimeout(timer);
  }, [results]);

  if (!results || results.length === 0) return null;

  return (
    <div className={cn("mt-6", className)}>
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-4 sm:p-6 bg-card/60 border border-border/50 rounded-t-xl cursor-pointer transition-all duration-300 ease-in-out mx-1 sm:mx-2",
          "hover:bg-card/80 hover:border-border/70",
          isExpanded ? "rounded-t-xl" : "rounded-xl shadow-sm"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} Reddit search results`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 flex-shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-black dark:text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                Reddit Search Results
              </span>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
              {isStreaming && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-black dark:bg-white animate-pulse" />
                  <span className="text-xs text-black dark:text-white">Live</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              "{searchQuery}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoadingMetadata && (
            <div className="w-4 h-4 border-2 border-black/30 dark:border-white/30 border-t-black dark:border-t-white rounded-full animate-spin" />
          )}
          <div className={cn(
            "w-4 h-4 transition-transform duration-300 ease-in-out text-muted-foreground",
            isExpanded && "rotate-180"
          )}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out mx-1 sm:mx-2",
        isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="border-l border-r border-b border-border/50 rounded-b-xl bg-card/40 p-4 sm:p-6 shadow-md">
          {/* Citations Grid */}
          <div className="grid gap-4 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 p-1 sm:p-2">
            {citations.map((citation, index) => (
              <RedditCitationCard key={index} citation={citation} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reddit Citation Card Component
function RedditCitationCard({ citation }: { citation: CitationData }) {
  const getPostTypeIcon = () => {
    switch (citation.postType) {
      case 'post':
        return <ArrowUp className="h-3 w-3" />;
      case 'comment':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getPostTypeColor = () => {
    switch (citation.postType) {
      case 'post':
        return 'text-black dark:text-white';
      case 'comment':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/80",
        "hover:border-black/50 dark:hover:border-white/50 hover:bg-card hover:shadow-lg transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-black/40 dark:focus:ring-white/40 focus:border-black/60 dark:focus:border-white/60",
        "backdrop-blur-sm min-h-[120px] mobile-touch"
      )}
    >
      {/* Header with subreddit info */}
      <div className="flex items-center gap-2 p-3 pb-2 border-b border-border/30">
        <div className={cn("flex items-center gap-1", getPostTypeColor())}>
          {getPostTypeIcon()}
          <span className="text-xs font-medium">
            {citation.postType === 'post' ? 'Post' : citation.postType === 'comment' ? 'Comment' : 'Discussion'}
          </span>
        </div>
        {citation.subreddit && (
          <div className="flex items-center gap-1 text-black dark:text-white">
            <span className="text-xs font-medium">r/{citation.subreddit}</span>
          </div>
        )}
        <div className="ml-auto">
          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-black dark:group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 pt-2">
        <div className="space-y-2">
          {citation.isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 bg-muted/30 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <>
              <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                {citation.title || 'Reddit Discussion'}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {citation.description || `Discussion from ${citation.domain}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 p-3 pt-0 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>reddit.com</span>
      </div>
    </a>
  );
}

export default RedditSearchCitations;
