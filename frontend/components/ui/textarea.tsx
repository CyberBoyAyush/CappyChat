/**
 * Textarea Component
 *
 * Used in: frontend/components/InputField.tsx, frontend/components/MessageEditor.tsx
 * Purpose: Reusable textarea component with auto-resize functionality.
 * Used for message input and editing with consistent styling.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  variant?: "default" | "field";
};

function Textarea({ className, variant = "default", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        "flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 transition-[color,box-shadow] outline-none",
        // Text & placeholder
        "text-foreground placeholder:text-muted-foreground/60",
        // Border and focus states
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Variant backgrounds
        variant === "default" && "bg-transparent dark:bg-input/30",
        variant === "field" &&
          "rounded-lg border-1 border-primary/40 bg-background dark:bg-background focus-visible:ring-primary/50",
        // Invalid states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Mobile optimizations
        "text-base mobile-input shadow-xs",
        // Added scrolling behavior
        "overflow-y-auto overflow-x-hidden",
        className
      )}
      style={{ caretColor: "currentColor" }}
      {...props}
    />
  );
}

export { Textarea };
