'use client';

/**
 * ThemeProvider Component
 *
 * Used in: app/layout.tsx
 * Purpose: Provides theme context and management for the entire application.
 * Handles light/dark theme switching and system theme detection.
 */

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
