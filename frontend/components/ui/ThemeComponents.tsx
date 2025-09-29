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
  MoonStar,
  MoonStarIcon,
  CloudSun,
  CloudSunIcon,
} from "lucide-react";
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

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [supportsHover, setSupportsHover] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(hover: hover)");
    setSupportsHover(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setSupportsHover(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  React.useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleMouseEnter = React.useCallback(() => {
    if (supportsHover) {
      setIsDropdownOpen(true);
    }
  }, [supportsHover]);

  const handleMouseLeave = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!supportsHover) return;

      const relatedTarget = event.relatedTarget as Node | null;
      if (
        relatedTarget &&
        dropdownRef.current &&
        dropdownRef.current.contains(relatedTarget)
      ) {
        return;
      }

      setIsDropdownOpen(false);
    },
    [supportsHover]
  );

  const containerClassName = baseClasses
    ? `${baseClasses} inline-flex`
    : "inline-flex";

  const handleThemeSelection = (value: string) => {
    setTheme(value);
    setIsDropdownOpen(false);
  };

  return (
    <div className={containerClassName}>
      <div
        ref={dropdownRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button
          type="button"
          variant={isDarkTheme ? "outline" : "secondary"}
          size="icon"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`group focus:outline-none shadow-sm rounded-md focus:ring-0 ${className}`}
        >
          <div className="relative w-4 h-4 group-hover:scale-110 transition-all duration-300 ease-in-out">
            {getThemeIcon()}
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>

        {isDropdownOpen && (
          <>
            <div
              className="absolute right-0 top-full z-40 h-3 w-36"
              aria-hidden="true"
            />
            <div
              role="menu"
              tabIndex={-1}
              className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-border/40 bg-popover/98 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200"
            >
              <button
                type="button"
                role="menuitemradio"
                aria-checked={theme === "light"}
                onClick={() => handleThemeSelection("light")}
                className={`flex items-center mb-1 gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  theme === "light"
                    ? "bg-muted/80 text-foreground shadow-inner"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <Sun className="h-4 w-4 text-white" />
                Bright
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={theme === "dark"}
                onClick={() => handleThemeSelection("dark")}
                className={`flex items-center mb-1 gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  theme === "dark"
                    ? "bg-muted/80 text-foreground shadow-inner"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <Moon className="h-4 w-4 text-black" />
                Dark
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={theme === "capybara-light"}
                onClick={() => handleThemeSelection("capybara-light")}
                className={`flex items-center gap-2 mb-1 w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  theme === "capybara-light"
                    ? "bg-muted/80 text-foreground shadow-inner"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <CloudSun className="h-4 w-4 text-[#ffd6a7]" />
                Light
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={theme === "capybara-dark"}
                onClick={() => handleThemeSelection("capybara-dark")}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  theme === "capybara-dark"
                    ? "bg-muted/80 text-foreground shadow-inner"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <MoonStarIcon className="h-4 w-4 text-amber-800" />
                Dark Pro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default ThemeToggleButton;
