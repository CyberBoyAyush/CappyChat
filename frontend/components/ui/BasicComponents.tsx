/**
 * Basic UI Components
 *
 * Used in: Various components throughout the application
 * Purpose: Consolidated basic UI primitives including skeleton, separator, badge, and toaster.
 * Contains simple, reusable components for layout, loading states, and notifications.
 */

'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as LabelPrimitive from '@radix-ui/react-label';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { cn } from '@/lib/utils';

// ===============================================
// Skeleton Component
// ===============================================

/**
 * Skeleton Component
 *
 * Used in: frontend/components/ui/sidebar.tsx
 * Purpose: Provides loading placeholder with animated shimmer effect.
 * Used to show loading states while content is being fetched.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

// ===============================================
// Separator Component
// ===============================================

/**
 * Separator Component
 *
 * Used in: frontend/components/ui/sidebar.tsx
 * Purpose: Provides visual separation between sections with horizontal or vertical lines.
 * Used for layout organization and visual hierarchy.
 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className
      )}
      {...props}
    />
  );
}

// ===============================================
// Badge Component
// ===============================================

/**
 * Badge Component
 *
 * Used in: frontend/components/ApiKeyConfigForm.tsx (if needed)
 * Purpose: Displays small status indicators or labels with different variants.
 * Used to show model names and other categorical information.
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

// ===============================================
// Toaster Component
// ===============================================

/**
 * Toaster Component
 *
 * Used in: app/layout.tsx
 * Purpose: Provides toast notification system for the entire application.
 * Shows success, error, and info messages with theme-aware styling.
 */
function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

// ===============================================
// Label Component
// ===============================================

/**
 * Label Component
 *
 * Used in: Various form components
 * Purpose: Provides accessible form labels with consistent styling.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Skeleton, Separator, Badge, Toaster, Label };
