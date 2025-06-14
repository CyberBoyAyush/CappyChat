/**
 * Theme Components
 *
 * Used in: app/layout.tsx, frontend/components/ChatInterface.tsx
 * Purpose: Consolidated theme-related components including provider and toggle button.
 * Handles theme context, switching, and visual controls for the entire application.
 */

'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme, ThemeProvider as NextThemesProvider } from 'next-themes';
import { Button } from '@/frontend/components/ui/button';

// ===============================================
// Theme Provider Component
// ===============================================

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// ===============================================
// Theme Toggle Button Component
// ===============================================

interface ThemeToggleButtonProps {
  className?: string;
  variant?: 'fixed' | 'inline';
}

export function ThemeToggleButton({
  className = '',
  variant = 'fixed'
}: ThemeToggleButtonProps) {
  const { setTheme, theme } = useTheme();

  const baseClasses = variant === 'fixed'
    ? "fixed top-4 right-4 z-50"
    : "";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={`focus-enhanced ${baseClasses} ${className}`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Default export for backward compatibility
export default ThemeToggleButton;
