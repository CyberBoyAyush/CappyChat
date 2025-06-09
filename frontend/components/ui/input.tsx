/**
 * Input Component
 *
 * Used in: frontend/components/ApiKeyConfigForm.tsx, frontend/components/ui/sidebar.tsx
 * Purpose: Reusable input field component with consistent styling.
 * Used for text inputs, API key fields, and search functionality.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow] outline-none",
        // Background and text colors
        "bg-input text-foreground placeholder:text-muted-foreground",
        // Light mode specific - better separation from background
        "border-border shadow-sm",
        // Dark mode adjustments
        "dark:bg-input/30 dark:border-input",
        // Focus states
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-enhanced",
        // File input styles
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Selection styles
        "selection:bg-primary selection:text-primary-foreground",
        // Invalid states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Disabled states
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Responsive text size
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
