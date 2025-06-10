/**
 * Textarea Component
 *
 * Used in: frontend/components/InputField.tsx, frontend/components/MessageEditor.tsx
 * Purpose: Reusable textarea component with auto-resize functionality.
 * Used for message input and editing with consistent styling.
 */

import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        'flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 transition-[color,box-shadow] outline-none',
        // Background and text
        'bg-transparent text-foreground placeholder:text-muted-foreground',
        // Border and focus states
        'border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        // Dark mode adjustments
        'dark:bg-input/30',
        // Invalid states
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        // Disabled states
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Mobile optimizations
        'text-base mobile-input shadow-xs',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
