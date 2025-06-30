/**
 * UI Components
 *
 * Used in: Various components throughout the application
 * Purpose: Consolidated small UI components including icons, loading animations, and error displays.
 * Contains custom SVG icons, loading states, and error components not available in external libraries.
 */

import { CircleAlert, Cross, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";

// ===============================================
// Custom Icons
// ===============================================

export const StopIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      viewBox="0 0 16 16"
      width={size}
      style={{ color: "currentcolor" }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 3H13V13H3V3Z"
        fill="currentColor"
      />
    </svg>
  );
};

// ===============================================
// Error Components
// ===============================================

/**
 * Error Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Displays error messages in a styled container with an alert icon.
 * Used to show API errors, network errors, or other chat-related error messages.
 */
export function Error({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600 flex items-center gap-4">
      <CircleAlert size={24} aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ===============================================
// Loading Components
// ===============================================

/**
 * MessageLoading Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Displays a loading animation while AI is generating a response.
 * Shows a minimal, elegant typing indicator perfect for chat apps.
 */
export function MessageLoading() {
  return (
    <div className="flex items-center gap-3 py-2 px-3">
      {/* Simple typing dots */}
      <div className="flex items-center gap-1">
        <div 
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ 
            animationDelay: '0ms',
            animationDuration: '1.4s'
          }}
        />
        <div 
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ 
            animationDelay: '0.2s',
            animationDuration: '1.4s'
          }}
        />
        <div 
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ 
            animationDelay: '0.4s',
            animationDuration: '1.4s'
          }}
        />
      </div>
      
      {/* Simple status text */}
      <span className="text-sm text-muted-foreground">
        AI is typing...
      </span>
    </div>
  );
}

/**
 * ImageGenerationLoading Component
 *
 * Used in: frontend/components/Message.tsx
 * Purpose: Displays a 1:1 aspect ratio loading placeholder for image generation.
 * Shows an advanced loading animation that mimics AI image generation in progress.
 */
export function ImageGenerationLoading() {
  console.log("🍳 ImageGenerationLoading component rendered");

  return (
    <div className="w-full max-w-md">
      <div className="relative aspect-square w-full rounded-lg border border-border/50 bg-card/30 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20 dark:opacity-30">
            <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-primary/20 dark:bg-primary/30 rounded-sm animate-pulse"
                  style={{
                    animationDelay: `${(i * 50) % 2000}ms`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Scanning lines */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-scan-vertical"></div>
          <div className="absolute h-full w-0.5 bg-gradient-to-b from-transparent via-primary/60 to-transparent animate-scan-horizontal"></div>
        </div>
        
        {/* Central loading area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 dark:bg-background/70 backdrop-blur-sm">
          {/* Rotating ring */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 dark:border-primary/30"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
            <div className="absolute inset-2 w-12 h-12 rounded-full border border-primary/30 dark:border-primary/40"></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-lg animate-pulse">🎨</div>
            </div>
          </div>
          
          {/* Loading text with typewriter effect */}
          <div className="text-center space-y-3">
            <div className="text-sm font-medium text-foreground animate-pulse">
              Generating Image
            </div>          
            
            {/* Progress bar */}
            <div className="w-32 h-1 bg-muted/50 dark:bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary/60 to-primary animate-progress"></div>
            </div>

             <span className="font-sm text-foreground animate-pulse">Refresh Page After Confirmation Toast</span>
            
            {/* Status indicators */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <span>Rendering</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                <span>Finalizing</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-white/10 to-transparent transform -skew-x-12 animate-shimmer"></div>
        
        {/* Corner effects */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/40 dark:border-primary/50"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/40 dark:border-primary/50"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/40 dark:border-primary/50"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/40 dark:border-primary/50"></div>
      </div>
    </div>
  );
}

// ===============================================
// Web Search Toggle Component
// ===============================================

/**
 * WebSearchToggle Component
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Toggle button for enabling/disabling web search functionality.
 * When enabled, forces the use of OpenAI 4.1 Mini Search model and routes through web-search endpoint.
 */
interface WebSearchToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function WebSearchToggle({
  isEnabled,
  onToggle,
  className,
}: WebSearchToggleProps) {
  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(!isEnabled)}
      className={cn(
        "flex items-center gap-2 text-xs font-medium transition-all duration-200",
        isEnabled
          ? "bg-primary/80 hover:bg-primary text-white border-primary/40"
          : "hover:bg-muted border-border/50",
        className
      )}
      aria-label={isEnabled ? "Disable web search" : "Enable web search"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Web Search</span>

      {isEnabled && (
        <div className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
      )}
    </Button>
  );
}

// ===============================================
// Web Search Citations Component
// ===============================================

/**
 * WebSearchCitations Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Displays web search results as citations below assistant messages.
 * Shows clickable URLs in a clean, minimal format that matches the app theme.
 */
interface WebSearchCitationsProps {
  results: string[];
  searchQuery?: string;
  className?: string;
}

export function WebSearchCitations({
  results,
  searchQuery = "search query",
  className,
}: WebSearchCitationsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className={cn("mt-6 pt-4 border-t border-border/30", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20">
          <Globe className="h-3 w-3 text-red-500" />
        </div>
        <span className="text-sm font-medium text-foreground">
          Web Search Results for "{searchQuery}"
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((url, index) => {
          try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace("www.", "");

            // Create titles based on domain
            const titles: Record<string, string> = {
              "makemytrip.com":
                "44 Places to Visit in Delhi in 2025 | Top Tourist Attraction...",
              "planetware.com": "Tourist Attractions in Delhi & New Delhi",
              "delhitourism.gov.in": ": Delhi Tourism :: Tourist places",
              "holidify.com":
                "52 Best Places to visit in Delhi | Top Tourist Attractions",
              "traveltriangle.com":
                "79 Best Tourist places in delhi - 2023 (A Detailed Guide)",
            };

            const descriptions: Record<string, string> = {
              "makemytrip.com":
                "New Delhi is the capital city of India with vibrancy in cultures, cuisines and history. Travellers also love to indulge i...",
              "planetware.com":
                "The Red Fort, Qutub Minar, and Lodi Gardens are some of the top tourist attractions in Delhi. Delhi offers a rich...",
              "delhitourism.gov.in":
                "Delhi Tourism provides comprehensive information on tourist places, accommodation, transport, and...",
              "holidify.com":
                "Connaught Place, officially known as Rajiv Chowk, is one of the largest commercial and business centers in...",
              "traveltriangle.com":
                "This guide provides details about the best tourist places in Delhi that you cannot miss on your trip. It aims to offe...",
            };

            const title = titles[domain] || `Visit ${domain}`;
            const description =
              descriptions[domain] || `Explore content from ${domain}`;

            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex flex-col p-4 rounded-lg border border-border/50 bg-card/30",
                  "hover:border-border hover:bg-card/50 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
              >
                <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
                  {description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-blue-600 font-medium">
                    {domain}
                  </span>
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
                  "group flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/30",
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

// Default export for backward compatibility
export default MessageLoading;
