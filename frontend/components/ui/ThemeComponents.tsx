/**
 * Theme Components
 *
 * Used in: app/layout.tsx, frontend/components/ChatInterface.tsx
 * Purpose: Consolidated theme-related components including provider and toggle button.
 * Handles theme context, switching, and visual controls for the entire application.
 */

"use client";

import * as React from "react";
import {
  Moon,
  Sun,
  Palette,
  MoonStar,
  MoonStarIcon,
  CloudSun,
  CloudSnow,
  CloudSunIcon,
} from "lucide-react";
import { useTheme, ThemeProvider as NextThemesProvider } from "next-themes";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";

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

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-primary" />;
      case "dark":
        return <Moon className="h-4 w-4 text-primary" />;
      case "capybara-light":
        return <CloudSunIcon className="h-4 w-4 text-primary" />;
      case "capybara-dark":
        return <MoonStar className="h-4 w-4 text-primary" />;
      default:
        return <Sun className="h-4 w-4 text-primary" />;
    }
  };

  const isDarkTheme = theme === "dark";

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case "light":
        return "Bright";
      case "dark":
        return "Dark";
      case "capybara-light":
        return "Light";
      case "capybara-dark":
        return "Dark Pro";
      default:
        return "Bright";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isDarkTheme ? "outline" : "secondary"}
          size="icon"
          className={`group focus:outline-none shadow-sm rounded-md focus:ring-0 ${baseClasses} ${className}`}
        >
          <div className="relative w-4 h-4 group-hover:scale-110 transition-all duration-300 ease-in-out">
            {getThemeIcon()}
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4 text-white" />
          Bright
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4 text-black" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("capybara-light")}>
          <CloudSun className="mr-2 h-4 w-4 text-[#ffd6a7]" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("capybara-dark")}>
          <MoonStarIcon className="mr-2 h-4 w-4 text-amber-800" />
          Dark Pro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Default export for backward compatibility
export default ThemeToggleButton;
