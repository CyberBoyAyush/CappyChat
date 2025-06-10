/**
 * Skeleton Component
 *
 * Used in: frontend/components/ui/sidebar.tsx
 * Purpose: Provides loading placeholder with animated shimmer effect.
 * Used to show loading states while content is being fetched.
 */

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
