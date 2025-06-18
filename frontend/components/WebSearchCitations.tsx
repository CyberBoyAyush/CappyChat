import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Image as ImageIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CitationData {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  domain: string;
  isLoading?: boolean;
}

interface WebSearchCitationsProps {
  results: string[];
  searchQuery?: string;
  className?: string;
  isStreaming?: boolean;
}

export function WebSearchCitations({
  results,
  searchQuery = "search query",
  className,
  isStreaming = false
}: WebSearchCitationsProps) {
  const [citations, setCitations] = useState<CitationData[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Convert URLs to citation data with metadata
  useEffect(() => {
    console.log('🔗 WebSearchCitations received results:', results);
    if (!results || results.length === 0) return;

    const initialCitations: CitationData[] = results.map(url => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        return {
          url,
          domain,
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
            // Use a metadata service or extract from URL
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
    <div className={cn("mt-6 pt-4 border-t border-border/20", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20">
          <Globe className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Sources
          </h3>
          <p className="text-xs text-muted-foreground">
            {isStreaming ? 'Loading citations...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        {isLoadingMetadata && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 animate-spin" />
            <span>Loading details...</span>
          </div>
        )}
      </div>

      {/* Citations Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {citations.map((citation, index) => (
          <CitationCard key={index} citation={citation} />
        ))}
      </div>
    </div>
  );
}

// Citation Card Component
function CitationCard({ citation }: { citation: CitationData }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40",
        "hover:border-border/80 hover:bg-card/60 hover:shadow-md transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
        "backdrop-blur-sm"
      )}
    >
      {/* Image Header */}
      {citation.image && !imageError && (
        <div className="relative h-32 bg-muted/30 overflow-hidden">
          <img
            src={citation.image}
            alt={citation.title || citation.domain}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              "group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 space-y-2">
        {/* Favicon and Domain */}
        <div className="flex items-center gap-2 mb-2">
          {citation.favicon ? (
            <img
              src={citation.favicon}
              alt=""
              className="w-4 h-4 rounded-sm flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-4 h-4 rounded-sm bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Globe className="h-2.5 w-2.5 text-primary" />
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground truncate">
            {citation.domain}
          </span>
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <h4 className={cn(
          "font-semibold text-sm leading-tight text-foreground line-clamp-2",
          "group-hover:text-primary transition-colors"
        )}>
          {citation.title || citation.domain}
        </h4>

        {/* Description */}
        {citation.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {citation.description}
          </p>
        )}

        {/* Loading state */}
        {citation.isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
            <span>Loading details...</span>
          </div>
        )}
      </div>


    </a>
  );
}

// Helper function to fetch URL metadata
async function fetchUrlMetadata(url: string): Promise<Partial<CitationData>> {
  try {
    // For now, we'll extract basic info from the URL and use a favicon service
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    // Use favicon service
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    // Use a simple image service for website screenshots (optional)
    // const image = `https://api.screenshotmachine.com/?key=YOUR_KEY&url=${encodeURIComponent(url)}&dimension=1024x768`;

    // For now, return basic metadata
    // In a real implementation, you might want to:
    // 1. Use a metadata extraction service
    // 2. Implement server-side metadata fetching
    // 3. Use OpenGraph/Twitter Card data

    return {
      favicon,
      title: generateTitleFromUrl(url),
      description: `Visit ${domain} for more information`
    };
  } catch (error) {
    console.error('Error fetching metadata for URL:', url, error);
    return {};
  }
}

// Helper function to generate a readable title from URL
function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;

    // Extract meaningful parts from the path
    const pathParts = path.split('/').filter(part => part && part !== 'index.html');

    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      // Convert kebab-case or snake_case to title case
      const title = lastPart
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      return `${title} - ${domain}`;
    }

    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return url;
  }
}

// Utility function to extract URLs from text content
export function extractUrlsFromContent(content: string): string[] {
  // Enhanced URL regex that matches various URL patterns including special characters
  const urlRegex = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.\-~!$&'()*+,;=:@])*(?:\?(?:[\w&=%.\-~!$'()*+,;:@/])*)?(?:\#(?:[\w.\-~!$&'()*+,;=:@/])*)?)?/gi;

  const urls = content.match(urlRegex) || [];

  // Clean up URLs by removing trailing punctuation that might be captured
  const cleanedUrls = urls.map(url => {
    // Remove trailing punctuation that's likely not part of the URL
    return url.replace(/[.,;:!?)\]}>]+$/, '');
  });

  // Remove duplicates and filter out common non-citation URLs
  const uniqueUrls = [...new Set(cleanedUrls)].filter(url => {
    const lowerUrl = url.toLowerCase();
    // Filter out common non-citation URLs
    return !lowerUrl.includes('google.com/search') &&
           !lowerUrl.includes('youtube.com/watch') &&
           !lowerUrl.includes('twitter.com/') &&
           !lowerUrl.includes('facebook.com/') &&
           !lowerUrl.includes('instagram.com/') &&
           !lowerUrl.includes('linkedin.com/in/') &&
           !lowerUrl.includes('reddit.com/r/') &&
           !lowerUrl.includes('github.com/') &&
           !lowerUrl.endsWith('.jpg') &&
           !lowerUrl.endsWith('.png') &&
           !lowerUrl.endsWith('.gif') &&
           !lowerUrl.endsWith('.pdf');
  });

  return uniqueUrls.slice(0, 10); // Limit to 10 citations max
}

export default WebSearchCitations;
