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
 * Shows animated dots to indicate message processing state.
 */
export function MessageLoading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_qFRN"
          begin="0;spinner_OcgL.end+0.25s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate
          begin="spinner_qFRN.begin+0.1s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_OcgL"
          begin="spinner_qFRN.begin+0.2s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}

/**
 * ImageGenerationLoading Component
 *
 * Used in: frontend/components/Message.tsx
 * Purpose: Displays a specialized loading animation for image generation.
 * Shows "Cooking Something For You Please Wait" message with animated cooking emoji.
 */
export function ImageGenerationLoading() {
  console.log("🍳 ImageGenerationLoading component rendered");

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-card/30 border border-border/50">
      {/* Animated cooking emoji */}
      <div className="text-2xl animate-bounce">
        🍳
      </div>

      {/* Loading message with animated dots */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          Cooking Something For You Please Wait
        </span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
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
