'use client';

import * as React from 'react';
/**
 * ThemeToggleButton Component
 *
 * Used in: frontend/components/ChatInterface.tsx, frontend/components/sidebar/SidebarFooter.tsx
 * Purpose: Provides a button to toggle between light and dark themes.
 * Shows appropriate icon based on current theme state.
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/frontend/components/ui/button';

interface ThemeToggleButtonProps {
  className?: string;
  variant?: 'fixed' | 'inline';
}

export default function ThemeToggleButton({
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
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`focus-enhanced transition-all duration-200 hover:scale-105 ${baseClasses} ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
