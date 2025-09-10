/**
 * Theme Components
 *
 * Used in: app/layout.tsx, frontend/components/ChatInterface.tsx
 * Purpose: Consolidated theme-related components including provider and toggle button.
 * Handles theme context, switching, and visual controls for the entire application.
 */

"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme, ThemeProvider as NextThemesProvider } from "next-themes";
import { Button } from "@/frontend/components/ui/button";

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
  variant?: "fixed" | "inline";
}

export function ThemeToggleButton({
  className = "",
  variant = "fixed",
}: ThemeToggleButtonProps) {
  const { setTheme, theme } = useTheme();

  const baseClasses = variant === "fixed" ? "fixed top-4 right-4 z-50" : "";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`group focus:outline-none focus:ring-0  ${baseClasses} ${className}`}
    >
      <div className="relative w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 ease-in-out">
        <Sun className="absolute h-4 w-4 scale-100 transition-all duration-500 ease-in-out dark:rotate-180 dark:scale-0 dark:opacity-0" />
        <Moon className="absolute h-4 w-4 rotate-180 scale-0 opacity-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100 dark:opacity-100" />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Default export for backward compatibility
export default ThemeToggleButton;
