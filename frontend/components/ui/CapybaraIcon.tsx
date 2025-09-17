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
    | "text-xs"
    | "text-sm"
    | "text-md"
    | "text-lg"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl";
  animated?: boolean;
  showLoader?: boolean;
  className?: string;
}

const BASE_ICON_WIDTH_REM = 12; // Matches the 2XL icon width (w-48)
const BASE_ICON_HEIGHT_REM = 8; // Matches the 2XL icon height (h-44)
const BASE_LOADER_HEIGHT_REM = 1.1; // Loader height (h-4.5 equivalent)
const BASE_LOADER_GAP_REM = 0.02; // Space between icon and loader in 2XL scale

const SIZE_SCALE = {
  "text-xs": 0.08,
  "text-sm": 0.1,
  "text-md": 0.125,
  "text-lg": 0.16,
  xs: 0.22,
  sm: 0.35,
  md: 0.5,
  lg: 0.7,
  xl: 0.85,
  "2xl": 1,
} as const;

type CapybaraIconSize = keyof typeof SIZE_SCALE;

const getScaledDimensions = (size: CapybaraIconSize, showLoader: boolean) => {
  const scale = SIZE_SCALE[size];
  const width = BASE_ICON_WIDTH_REM * scale;
  const iconHeight = BASE_ICON_HEIGHT_REM * scale;
  const loaderHeight = showLoader ? BASE_LOADER_HEIGHT_REM * scale : 0;
  const loaderGap = showLoader ? BASE_LOADER_GAP_REM * scale : 0;

  return {
    scale,
    width,
    iconHeight,
    loaderHeight,
    loaderGap,
    totalHeight: iconHeight + loaderGap + loaderHeight,
  };
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
  size = "2xl",
  animated = true,
  showLoader = false,
  className = "",
}: CapybaraIconProps) {
  const { theme } = useTheme();
  const colors = getCapybaraColors(theme);
  const { scale, width, iconHeight, loaderHeight, loaderGap, totalHeight } =
    getScaledDimensions(size, showLoader);

  const rootStyle = {
    width: `${width}rem`,
    height: `${totalHeight}rem`,
    "--color": colors.primary,
    "--color2": colors.secondary,
    "--color3": colors.accent,
    "--color4": colors.dark,
  } as React.CSSProperties;

  const iconWrapperStyle: React.CSSProperties = {
    width: `${BASE_ICON_WIDTH_REM}rem`,
    height: `${BASE_ICON_HEIGHT_REM}rem`,
    transform: `scale(${scale})`,
    transformOrigin: "bottom left",
  };

  const loaderWrapperStyle: React.CSSProperties = {
    width: `${BASE_ICON_WIDTH_REM}rem`,
    height: `${BASE_LOADER_HEIGHT_REM}rem`,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return (
    <div
      className={cn(
        "relative z-[1] flex-shrink-0",
        !animated && "[&_*]:!animation-none",
        className
      )}
      style={rootStyle}
    >
      <div
        className="relative"
        style={{ width: `${width}rem`, height: `${iconHeight}rem` }}
      >
        <div className="absolute left-0 bottom-0" style={iconWrapperStyle}>
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
        </div>
      </div>

      {showLoader && (
        <div
          className="relative"
          style={{
            width: `${width}rem`,
            height: `${loaderHeight}rem`,
            marginTop: `${loaderGap}rem`,
          }}
        >
          <div
            className="loader w-[12rem] h-8 relative z-[1] overflow-hidden"
            style={loaderWrapperStyle}
          >
            <div className="loaderline w-[50em] h-2 border-t-2 border-dashed border-[var(--color2)] animate-moveline"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CapybaraIcon;
