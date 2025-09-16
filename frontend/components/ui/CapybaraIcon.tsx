/**
 * CapybaraIcon Component
 *
 * Purpose: Reusable animated capybara icon that can be used anywhere in the app
 * Features: Customizable size, animation toggle, and responsive design
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CapybaraIconProps {
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl";
  animated?: boolean;
  showLoader?: boolean;
  className?: string;
}

// Function to get size classes based on whether loader is shown
// Widths increased to prevent horizontal clipping of the capybara
const getSizeClasses = (size: string, showLoader: boolean) => {
  const sizes = {
    xs: showLoader ? "w-8 h-8" : "w-8 h-6", // Extra Small: increased width to prevent clipping
    sm: showLoader ? "w-16 h-16" : "w-16 h-12", // Small: increased width to prevent clipping
    md: showLoader ? "w-24 h-24" : "w-24 h-20", // Medium: increased width to prevent clipping
    lg: showLoader ? "w-32 h-32" : "w-32 h-28", // Large: increased width to prevent clipping
    xl: showLoader ? "w-40 h-40" : "w-40 h-36", // XL: increased width to prevent clipping
    "2xl": showLoader ? "w-56 h-32" : "w-48 h-44", // 2XL: increased width to prevent clipping
    "3xl": showLoader ? "w-64 h-36" : "w-64 h-60", // 3XL: increased width to prevent clipping
    "4xl": showLoader ? "w-84 h-84" : "w-84 h-80", // 4XL: increased width to prevent clipping
    "5xl": showLoader ? "w-100 h-100" : "w-100 h-96", // 5XL: increased width to prevent clipping
    "6xl": showLoader ? "w-[30rem] h-[30rem]" : "w-[30rem] h-[28rem]", // 6XL: increased width to prevent clipping
  };
  return sizes[size as keyof typeof sizes] || sizes.lg;
};

const scaleClasses = {
  xs: "scale-[0.15]", // Ultra tiny
  sm: "scale-[0.35]", // Small
  md: "scale-50", // Medium
  lg: "scale-75", // Large (default)
  xl: "scale-90", // Extra large
  "2xl": "scale-100", // 2X large
  "3xl": "scale-110", // 3X large
  "4xl": "scale-125", // 4X large
  "5xl": "scale-150", // 5X large
  "6xl": "scale-200", // 6X large - Ultra
};

// Capybara color palettes - fixed colors that don't change with app theme
const capybaraColors = {
  light: {
    primary: "#D9C1A5", // Light tan/beige
    secondary: "#673903", // Dark brown
    accent: "#C86F07", // Orange/amber
    dark: "#010101", // Black
  },
  dark: {
    primary: "#B8956D", // Main capybara body color (from image)
    secondary: "#3D2914", // Dark brown for shadows/details
    accent: "#8B6914", // Medium brown for accents
    dark: "#2A1810", // Darkest brown for features
  },
};

// Get capybara colors based on current theme
const getCapybaraColors = (theme: string | undefined) => {
  if (theme?.includes("capybara")) {
    return theme.includes("light") ? capybaraColors.light : capybaraColors.dark;
  }
  // Default to light capybara colors for non-capybara themes
  return capybaraColors.light;
};

export function CapybaraIcon({
  size = "lg",
  animated = true,
  showLoader = false,
  className = "",
}: CapybaraIconProps) {
  const { theme } = useTheme();
  const colors = getCapybaraColors(theme);

  return (
    <div
      className={cn(
        "relative z-[1] flex-shrink-0", // Removed overflow-hidden to prevent clipping
        getSizeClasses(size, showLoader),
        scaleClasses[size],
        !animated && "[&_*]:!animation-none [&_*]:!transform-none", // Also disable transforms when not animated
        // Responsive scaling for very large sizes on mobile
        (size === "5xl" || size === "6xl") && "sm:scale-100 scale-75",
        className
      )}
      style={
        {
          "--color": colors.primary,
          "--color2": colors.secondary,
          "--color3": colors.accent,
          "--color4": colors.dark,
        } as React.CSSProperties
      }
    >
      <div className={cn("capybara w-full h-full relative z-[1]")}>
        <div className="capyhead w-[7.5em] h-[7em] bottom-0 right-[0.5em] absolute bg-[var(--color)] z-[3] rounded-[3.5em] shadow-[-1em_0_var(--color2)] animate-movebody">
          <div className="capyear w-8 h-8 bg-gradient-to-br from-[var(--color)] to-[var(--color2)] top-0 left-0 rounded-full absolute overflow-hidden z-[3]">
            <div className="capyear2 w-full h-4 bg-[var(--color2)] bottom-0 left-2 rounded-full absolute rotate-[-45deg]"></div>
          </div>
          <div className="capyear w-8 h-8 bg-gradient-to-br from-[var(--color)] via-[var(--color)] to-[var(--color2)] top-0 left-20 rounded-full absolute overflow-hidden z-[3]">
            <div className="capyear2 w-full h-4 bg-[var(--color2)] bottom-0 left-2 rounded-full absolute rotate-[-45deg]"></div>
          </div>
          <div className="capymouth w-14 h-8 bg-[var(--color2)] absolute bottom-0 left-10 rounded-[50%] flex justify-around items-center p-2">
            <div className="capylips w-1 h-3 rounded-full rotate-[-45deg] bg-[var(--color)]"></div>
            <div className="capylips w-1 h-3 rounded-full rotate-45 bg-[var(--color)]"></div>
          </div>
          <div className="capyeye w-8 h-2 bg-[var(--color2)] absolute bottom-14 left-6 rounded-[5em] rotate-45"></div>
          <div className="capyeye w-7 h-2 bg-[var(--color2)] absolute bottom-14 left-[5.5em] rounded-[5em] rotate-[-45deg]"></div>
        </div>

        <div className="capyleg w-24 h-20 bottom-0 left-0 absolute bg-gradient-to-b from-[var(--color)] to-[var(--color2)] z-[2] rounded-[2em] animate-movebody"></div>

        <div className="capyleg2 w-7 h-12 bottom-0 left-[3.25em] absolute bg-gradient-to-b from-[var(--color)] via-[var(--color)] to-[var(--color2)] z-[2] rounded-[0.75em] shadow-[inset_0_-0.5em_var(--color2)] animate-moveleg"></div>

        <div className="capyleg2 w-5 left-2 h-8 bottom-0 absolute bg-gradient-to-b from-[var(--color)] via-[var(--color)] to-[var(--color2)] z-[2] rounded-[0.75em] shadow-[inset_0_-0.5em_var(--color2)] animate-moveleg2 [animation-delay:0.075s]"></div>

        <div className="capy w-[75%] h-full bg-gradient-to-b from-[var(--color)] via-[var(--color)] to-[var(--color2)] rounded-[45%] relative z-[1] animate-movebody"></div>
      </div>

      {showLoader && (
        <div className="loader w-full h-8 relative z-[1] overflow-hidden">
          <div className="loaderline w-[50em] h-2 border-t-2 border-dashed border-[var(--color2)] animate-moveline"></div>
        </div>
      )}
    </div>
  );
}

export default CapybaraIcon;
