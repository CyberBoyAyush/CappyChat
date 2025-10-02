/**
 * UI Components
 *
 * Used in: Various components throughout the application
 * Purpose: Consolidated small UI components including icons, loading animations, and error displays.
 * Contains custom SVG icons, loading states, and error components not available in external libraries.
 */

import {
  CircleAlert,
  Globe,
  AlertTriangle,
  CreditCard,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router-dom";
import CapybaraIcon from "./CapybaraIcon";

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
 * Enhanced Error Component
 *
 * Used in: frontend/components/ChatMessageDisplay.tsx
 * Purpose: Displays error messages in a styled container with appropriate icons and styling.
 * Used to show API errors, network errors, or other chat-related error messages.
 */
interface ErrorProps {
  message: string;
  type?: "error" | "warning" | "info";
  className?: string;
}

export function Error({ message, type = "error", className }: ErrorProps) {
  const getErrorStyles = () => {
    switch (type) {
      case "warning":
        return {
          container:
            "border-[color:var(--toast-warning)]/30 bg-[color:var(--toast-warning)]/10",
          text: "text-[color:var(--toast-warning)]",
          icon: AlertTriangle,
          iconColor: "text-[color:var(--toast-warning)]",
        };
      case "info":
        return {
          container:
            "border-[color:var(--toast-info)]/30 bg-[color:var(--toast-info)]/10",
          text: "text-[color:var(--toast-info)]",
          icon: CircleAlert,
          iconColor: "text-[color:var(--toast-info)]",
        };
      default:
        return {
          container:
            "border-[color:var(--toast-error)]/30 bg-[color:var(--toast-error)]/10",
          text: "text-[color:var(--toast-error)]",
          icon: CircleAlert,
          iconColor: "text-[color:var(--toast-error)]",
        };
    }
  };

  const styles = getErrorStyles();
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 mb-8 flex items-start gap-2.5 sm:gap-3 transition-all duration-200",
        styles.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon
        size={18}
        className={cn("mt-0.5 flex-shrink-0 sm:w-5 sm:h-5", styles.iconColor)}
        aria-hidden="true"
      />
      <p
        className={cn(
          "text-xs sm:text-sm leading-relaxed break-words",
          styles.text
        )}
      >
        {message}
      </p>
    </div>
  );
}

/**
 * TierLimitError Component
 *
 * Used in: Various components when tier limits are exceeded
 * Purpose: Displays a visually appealing error message for monthly credit exhaustion
 * with upgrade prompts and clear messaging about plan limitations.
 */
interface TierLimitErrorProps {
  message?: string;

  className?: string;
}

export function TierLimitError({
  message = "Monthly credits exhausted. Update your current plan.",

  className,
}: TierLimitErrorProps) {
  const navigate = useNavigate();

  // Parse error message if it contains JSON structure
  const parseErrorMessage = (msg: string): string => {
    try {
      // Check if message contains JSON-like structure
      if (msg.includes('"error"') && msg.includes('"code"')) {
        // Extract the error message part
        const errorMatch = msg.match(/"error":"([^"]+)"/);
        if (errorMatch && errorMatch[1]) {
          return errorMatch[1];
        }
      }
      return msg;
    } catch {
      return msg;
    }
  };

  const displayMessage = parseErrorMessage(message);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[color:var(--border)]",
        "bg-gradient-to-br from-[color:var(--destructive)]/10 via-[color:var(--destructive)]/20 to-[color:var(--destructive)]/30",
        "shadow-lg backdrop-blur-sm max-w-full mb-8",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--muted)]/5 via-[color:var(--destructive)]/15 to-[color:var(--muted)]/5 animate-pulse" />

      {/* Content */}
      <div className="relative p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon with animated glow - smaller on mobile */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-[color:var(--destructive)]/20 animate-ping" />
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[color:var(--destructive)]/20 to-[color:var(--destructive)]/10 border border-[color:var(--destructive)]/30">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--destructive)]" />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground/90 flex items-center gap-2 leading-tight">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Credit Limit Reached</span>
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed break-words whitespace-pre-wrap">
                {displayMessage}
              </p>
            </div>

            {/* Action buttons - stack on mobile */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-1 sm:pt-2">
              <Button
                onClick={() => {
                  navigate('/pricing');
                }}
                className={cn(
                  "bg-[color:var(--primary)]",
                  "text-[color:var(--primary-foreground)] border-0 shadow-md hover:shadow-lg transition-all duration-200",
                  "flex items-center justify-center gap-2 font-medium text-sm w-full sm:w-auto"
                )}
                size="sm"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="truncate">Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-[color:var(--destructive)]/30 text-[color:var(--destructive)] hover:bg-[color:var(--destructive)]/10 text-sm w-full sm:w-auto"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>

        {/* Progress indicator - better mobile spacing */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[color:var(--destructive)]/20">
          <div className="flex items-center justify-between text-xs text-foreground/90 mb-2">
            <span className="font-medium">Monthly Usage</span>
            <span className="font-medium">100% Used</span>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-[color:var(--destructive)]/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[color:var(--destructive)] to-[color:var(--destructive)]/80 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Decorative elements - smaller on mobile */}
      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[color:var(--destructive)] rounded-full animate-pulse" />
      <div
        className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 w-1 h-1 bg-[color:var(--foreground)] rounded-full animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />
    </div>
  );
}

// ===============================================
// Error Utility Functions
// ===============================================

/**
 * Utility function to detect if an error is a tier limit error
 */
export function isTierLimitError(error: string): boolean {
  const tierLimitKeywords = [
    "tier_limit_exceeded",
    "TIER_LIMIT_EXCEEDED",
    "monthly credits exhausted",
    "credit limit",
    "plan limit",
    "usage limit",
    "quota exceeded",
  ];

  // Check the raw error message
  const errorLower = error.toLowerCase();
  const hasKeyword = tierLimitKeywords.some((keyword) =>
    errorLower.includes(keyword.toLowerCase())
  );

  // Also check if it's a JSON error with tier limit code
  if (error.includes('"code"') && error.includes("TIER_LIMIT_EXCEEDED")) {
    return true;
  }

  return hasKeyword;
}

/**
 * Enhanced error display component that automatically chooses between
 * regular Error and TierLimitError based on the error message
 */
interface SmartErrorProps {
  message: string;

  className?: string;
}

export function SmartError({ message, className }: SmartErrorProps) {
  if (isTierLimitError(message)) {
    return <TierLimitError message={message} className={className} />;
  }

  return <Error message={message} className={className} />;
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
    <div className="flex items-center gap-3 py-2  px-2">
      {/* Simple typing dots */}
      {/* <div className="flex items-center gap-1">
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{
            animationDelay: "0ms",
            animationDuration: "1.4s",
          }}
        />
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{
            animationDelay: "0.2s",
            animationDuration: "1.4s",
          }}
        />
        <div
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{
            animationDelay: "0.4s",
            animationDuration: "1.4s",
          }}
        />
      </div> */}

      {/* Simple status text */}
      <span className="text-sm flex gap-1 text-muted-foreground">
        CappyChat is typing{" "}
        <CapybaraIcon size="text-lg" animated={true} showLoader={false} /> ...
      </span>
    </div>
  );
}

/**
 * ImageGenerationLoading Component
 *
 * Used in: frontend/components/Message.tsx
 * Purpose: Displays a loading placeholder for image generation with dynamic aspect ratio.
 * Shows a lightweight block wave animation that's optimized for performance.
 */
interface ImageGenerationLoadingProps {
  aspectRatio?: string;
}

export function ImageGenerationLoading({
  aspectRatio = "1:1",
}: ImageGenerationLoadingProps) {
  // Map aspect ratios to CSS classes - matching the generated image display classes
  const aspectRatioClasses = {
    "1:1": "aspect-square max-w-md",
    "21:9": "aspect-[21/9] max-w-2xl",
    "16:9": "aspect-video max-w-2xl",
    "4:3": "aspect-[4/3] max-w-lg",
  };

  const aspectClass =
    aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses] ||
    "aspect-square max-w-md";

  // Generate grid blocks with randomized animations for realistic effect
  const gridSize = 16; // 16x16 grid for more blocks
  const totalBlocks = gridSize * gridSize;
  const blocks = Array.from({ length: totalBlocks }, (_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    // Create more realistic timing with randomization
    const baseDelay = (row + col) * 25;
    const randomOffset = Math.random() * 500; // Random 0-500ms offset
    const delay = baseDelay + randomOffset;

    // Vary animation duration for more organic feel
    const baseDuration = 1.5;
    const durationVariation = Math.random() * 1; // 0-1s variation
    const duration = baseDuration + durationVariation;

    // Random intensity for each block
    const intensity = 0.2 + Math.random() * 0.3; // 0.2-0.5 opacity range

    return { id: i, row, col, delay, duration, intensity };
  });

  return (
    <div
      className={cn(
        "relative w-full rounded-lg  bg-background/50 overflow-hidden",
        aspectClass
      )}
    >
      {/* Grid of animated blocks filling the entire area */}
      <div
        className="absolute inset-0 grid gap-0.5 p-1"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {blocks.map(({ id, delay, duration, intensity }) => (
          <div
            key={id}
            className="rounded-sm animate-pulse bg-primary"
            style={{
              opacity: intensity,
              animationDelay: `${delay}ms`,
              animationDuration: `${duration}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out",
            }}
          />
        ))}
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
 * Purpose: Toggle button for enabling/disabling Tavily-powered web search functionality.
 * When enabled, routes through web-search endpoint with Tavily integration for any selected model.
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
