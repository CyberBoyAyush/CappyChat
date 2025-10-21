import React, { useState, useEffect } from "react";
import {
  Globe,
  ExternalLink,
  Image as ImageIcon,
  Clock,
  Search,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { devLog, devError } from "@/lib/logger";
import { motion, AnimatePresence } from "framer-motion";

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
  className,
}: WebSearchCitationsProps) {
  const [citations, setCitations] = useState<CitationData[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert URLs to citation data with metadata
  useEffect(() => {
    devLog("🔗 WebSearchCitations received results:", results);
    if (!results || results.length === 0) return;

    const initialCitations: CitationData[] = results.map((url) => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace("www.", "");
        return {
          url,
          domain,
          isLoading: true,
        };
      } catch {
        return {
          url,
          domain: url,
          isLoading: true,
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
              isLoading: false,
            };
          } catch {
            return {
              ...citation,
              isLoading: false,
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
    <div className={cn("pt-6 pb-2  border-t border-border", className)}>
      {/* Collapsible Header */}
      <div
        className={cn(
          "flex items-center gap-3 pb-3 px-4 md:px-4 rounded-xl border border-border bg-card/60 cursor-pointer",
          "hover:bg-card/80 hover:border-border/80 hover:shadow-lg transition-all duration-300 ease-in-out",
          "focus:outline-none ",
          "shadow-sm min-h-[60px] sm:min-h-[56px]", // Add minimum height for mobile
          isExpanded && "rounded-b-none border-b-0 shadow-md"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {/* Icon and Title */}
        <div className="flex items-center justify-center w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 shadow-sm flex-shrink-0">
          <Search className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 md:flex justify-between min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base sm:text-base font-semibold text-foreground">
              Web Sources
            </h3>
            <span className="text-sm sm:text-sm font-medium text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
              {results.length}
            </span>
          </div>

          {/* Favicons Preview */}
          <div className="flex items-center gap-1 sm:gap-1 mr-2 sm:mr-3">
            {citations.slice(0, 6).map((citation, index) => (
              <div key={index} className="relative">
                {citation.favicon ? (
                  <img
                    src={citation.favicon}
                    alt=""
                    className="w-6 h-6 sm:w-5 sm:h-5 rounded-sm border border-border/30 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-sm bg-primary/20 border border-border/30 flex items-center justify-center shadow-sm">
                    <Globe className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-primary/70" />
                  </div>
                )}
              </div>
            ))}
            {results.length > 6 && (
              <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-sm bg-secondary/80 border border-border/30 flex items-center justify-center shadow-sm">
                <span className="text-[11px] sm:text-[10px] font-medium text-muted-foreground">
                  +{results.length - 6}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoadingMetadata && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full mr-2 sm:mr-3">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Loading...</span>
          </div>
        )}

        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronRight className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Expandable Content with Framer Motion */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="citations-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.6,
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden shadow-lg rounded-b-xl"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="border border-primary/20 rounded-b-xl bg-card/40 p-4 shadow-md"
            >
              {/* Citations Grid */}
              <div className="grid gap-4 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 p-1 sm:p-2">
                {citations.map((citation, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.05, // Stagger animation
                      duration: 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                  >
                    <CitationCard citation={citation} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
        "group relative shadow-sm flex flex-col overflow-hidden rounded-xl border border-border bg-card/80",
        "hover:border-border hover:bg-card hover:shadow-lg transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
        "backdrop-blur-sm min-h-[140px] sm:min-h-[120px] mobile-touch"
      )}
      onClick={(e) => e.stopPropagation()} // Prevent triggering parent collapse
    >
      {/* Image Header */}
      {citation.image && !imageError && (
        <div className="relative h-32 sm:h-28 md:h-32 bg-secondary/30 overflow-hidden flex-shrink-0">
          <img
            src={citation.image}
            alt={citation.title || citation.domain}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 ease-in-out",
              "group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
              <ImageIcon className="h-6 w-6 text-muted-foreground/60 animate-pulse" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 sm:p-4 space-y-3 min-h-0">
        {/* Favicon and Domain */}
        <div className="flex items-center gap-2.5 mb-2">
          {citation.favicon ? (
            <img
              src={citation.favicon}
              alt=""
              className="w-4 h-4 sm:w-4 sm:h-4 rounded-sm flex-shrink-0 opacity-80"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-4 h-4 sm:w-4 sm:h-4 rounded-sm bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Globe className="h-2.5 w-2.5 sm:h-2.5 sm:w-2.5 text-primary/70" />
            </div>
          )}
          <span className="text-xs sm:text-xs font-medium text-muted-foreground truncate flex-1">
            {citation.domain}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ExternalLink className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 text-muted-foreground/70" />
          </div>
        </div>

        {/* Title */}
        <h4
          className={cn(
            "font-semibold text-sm sm:text-sm leading-tight text-foreground line-clamp-2 mb-2",
            "group-hover:text-primary transition-colors duration-200"
          )}
        >
          {citation.title || citation.domain}
        </h4>

        {/* Description */}
        {citation.description && (
          <p className="text-xs sm:text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
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

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </a>
  );
}

// Helper function to fetch URL metadata
async function fetchUrlMetadata(url: string): Promise<Partial<CitationData>> {
  try {
    // For now, we'll extract basic info from the URL and use a favicon service
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");

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
      description: `Visit ${domain} for more information`,
    };
  } catch (error) {
    devError("Error fetching metadata for URL: " + url, error);
    return {};
  }
}

// Helper function to generate a readable title from URL
function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");
    const path = urlObj.pathname;

    // Extract meaningful parts from the path
    const pathParts = path
      .split("/")
      .filter((part) => part && part !== "index.html");

    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      // Convert kebab-case or snake_case to title case
      const title = lastPart
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${title} - ${domain}`;
    }

    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return url;
  }
}

// Utility function to extract URLs from text content
export function extractUrlsFromContent(content: string): string[] {
  devLog(
    "🔗 extractUrlsFromContent called with content length:",
    content.length
  );
  devLog("🔗 Content preview (first 200 chars):", content.substring(0, 200));
  devLog(
    "🔗 Content preview (last 200 chars):",
    content.substring(content.length - 200)
  );

  // First, check for search URLs marker (for web search results)
  const searchUrlsMarker = /<!-- SEARCH_URLS: (.*?) -->/;
  const markerMatch = content.match(searchUrlsMarker);

  if (markerMatch && markerMatch[1]) {
    devLog("🔗 Found search URLs marker:", markerMatch[1]);
    const searchUrls = markerMatch[1].split("|").filter((url) => url.trim());
    if (searchUrls.length > 0) {
      devLog("🔗 Extracted search URLs from marker:", searchUrls);
      return searchUrls;
    }
  } else {
    devLog("🔗 No search URLs marker found in content");
  }

  // Fallback: Enhanced URL regex that matches various URL patterns including special characters
  const urlRegex =
    /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.\-~!$&'()*+,;=:@])*(?:\?(?:[\w&=%.\-~!$'()*+,;:@/])*)?(?:\#(?:[\w.\-~!$&'()*+,;=:@/])*)?)?/gi;

  const urls = content.match(urlRegex) || [];

  // Clean up URLs by removing trailing punctuation that might be captured
  const cleanedUrls = urls.map((url) => {
    // Remove trailing punctuation that's likely not part of the URL
    return url.replace(/[.,;:!?)\]}>]+$/, "");
  });

  // Remove duplicates and filter out common non-citation URLs
  const uniqueUrls = [...new Set(cleanedUrls)].filter((url) => {
    const lowerUrl = url.toLowerCase();
    // Filter out common non-citation URLs
    return (
      !lowerUrl.includes("google.com/search") &&
      !lowerUrl.includes("youtube.com/watch") &&
      !lowerUrl.includes("twitter.com/") &&
      !lowerUrl.includes("facebook.com/") &&
      !lowerUrl.includes("instagram.com/") &&
      !lowerUrl.includes("linkedin.com/in/") &&
      !lowerUrl.includes("reddit.com/r/") &&
      !lowerUrl.includes("github.com/") &&
      !lowerUrl.endsWith(".jpg") &&
      !lowerUrl.endsWith(".png") &&
      !lowerUrl.endsWith(".gif") &&
      !lowerUrl.endsWith(".pdf")
    );
  });

  return uniqueUrls.slice(0, 10); // Limit to 10 citations max
}

// Utility function to clean message content by removing search URLs marker
export function cleanMessageContent(content: string): string {
  // Remove the search URLs and images markers from the content
  const searchUrlsMarker = /<!-- SEARCH_URLS: .*? -->/g;
  const searchImagesMarker = /<!-- SEARCH_IMAGES: .*? -->/g;
  const planArtifactsMarker = /<!-- PLAN_ARTIFACT_AVAILABLE -->/g;
  return content
    .replace(searchUrlsMarker, "")
    .replace(searchImagesMarker, "")
    .replace(planArtifactsMarker, "")
    .trim();
}

export default WebSearchCitations;
