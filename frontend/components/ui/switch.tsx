/**
 * Switch Component
 *
 * A beautiful toggle switch component with enhanced UI and accessibility.
 * Optimized for both light and dark modes with smooth animations and mobile-friendly design.
 * Updated to match the application's primary coral theme (#f76f52).
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  size = "md",
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      track: "h-4 w-7 sm:h-5 sm:w-9",
      thumb: "h-3 w-3 sm:h-4 sm:w-4",
      translate: checked
        ? "translate-x-3.5 sm:translate-x-4"
        : "translate-x-0.5",
      touchTarget: "p-0.5 sm:p-1",
    },
    md: {
      track: "h-5 w-8 sm:h-6 sm:w-11",
      thumb: "h-4 w-4 sm:h-5 sm:w-5",
      translate: checked
        ? "translate-x-3.5 sm:translate-x-5"
        : "translate-x-0.5",
      touchTarget: "p-1 sm:p-1.5",
    },
    lg: {
      track: "h-5 w-9 sm:h-7 sm:w-13",
      thumb: "h-4 w-4 sm:h-6 sm:w-6",
      translate: checked
        ? "translate-x-4.5 sm:translate-x-6"
        : "translate-x-0.5",
      touchTarget: "p-1 sm:p-2",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        // Base styles with mobile-friendly touch target
        "relative inline-flex items-center rounded-full transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "focus-visible:ring-offset-1 sm:focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",

        // Enhanced mobile interactions
        "hover:shadow-md active:scale-95 touch-manipulation",
        "min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex justify-center items-center",

        // Touch target paddingno-scrollbar
        currentSize.touchTarget,

        className
      )}
    >
      {/* Switch track */}
      <div
        className={cn(
          "relative inline-flex items-center rounded-full transition-all duration-300 ease-out",
          "shadow-sm border border-transparent",

          // Size classes
          currentSize.track,

          // Theme-aware colors using primary coral
          checked
            ? "bg-gradient-to-r from-primary to-primary/90 shadow-md sm:shadow-lg shadow-primary/20 sm:shadow-primary/25"
            : "bg-gradient-to-r from-muted/80 to-muted border-border/60 shadow-inner",

          // Hover states
          !disabled &&
            (checked
              ? "hover:from-primary/90 hover:to-primary/80 hover:shadow-primary/25 sm:hover:shadow-primary/30"
              : "hover:bg-muted/60 hover:border-border/80 hover:shadow-sm"),

          // Enhanced visual depth
          checked ? "ring-1 ring-primary/20" : ""
        )}
      >
        {/* Track gradient overlay for premium look */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-300",
            checked
              ? "bg-gradient-to-r from-primary/10 to-transparent opacity-100"
              : "bg-gradient-to-r from-muted-foreground/8 to-transparent opacity-80"
          )}
        />

        {/* Thumb */}
        <span
          className={cn(
            "pointer-events-none relative block rounded-full transition-all duration-300 ease-out",
            "shadow-lg ring-0 z-10",

            // Size classes
            currentSize.thumb,
            currentSize.translate,

            // Enhanced thumb styling
            "bg-background border",
            checked
              ? "border-primary/10 shadow-md sm:shadow-lg shadow-primary/15 sm:shadow-primary/20"
              : "border-border/40 shadow-sm sm:shadow-md shadow-black/10 sm:shadow-black/15 dark:shadow-black/30 dark:sm:shadow-black/40",

            // Smooth transform with bounce
            "transform-gpu will-change-transform"
          )}
        >
          {/* Inner gradient for depth */}
          <div
            className={cn(
              "absolute inset-0.5 rounded-full transition-all duration-300",
              "bg-gradient-to-br from-background to-background/80",
              checked
                ? "from-background via-background to-primary/5"
                : "from-background via-background/90 to-muted/20"
            )}
          />

          {/* Subtle indicator when checked */}
          {checked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full opacity-60 animate-pulse" />
            </div>
          )}
        </span>

        {/* Ripple effect on interaction */}
        <span
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-200 pointer-events-none",
            "bg-current opacity-0",
            !disabled && "hover:opacity-5 active:opacity-10"
          )}
        />

        {/* Subtle glow effect when checked */}
        {checked && (
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-sm opacity-50" />
        )}
      </div>
    </button>
  );
}
