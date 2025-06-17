/**
 * Font Store
 *
 * Purpose: Manages font selection and persistence for the entire application.
 * Handles font changes by updating CSS variables and storing preferences in localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FontOption {
  id: string;
  name: string;
  displayName: string;
  fontFamily: string;
  category: "basic" | "stylish" | "modern" | "classic" | "artistic";
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // Modern & Clean
  {
    id: "geist",
    name: "Geist",
    displayName: "Geist",
    fontFamily: "Geist, sans-serif",
    category: "modern",
    description: "Clean and modern (Default)",
  },
  {
    id: "inter",
    name: "Inter",
    displayName: "Inter",
    fontFamily: "Inter, sans-serif",
    category: "modern",
    description: "Highly readable and versatile",
  },

  // Classic & Serif
  {
    id: "georgia",
    name: "Georgia",
    displayName: "Georgia",
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
    category: "classic",
    description: "Classic serif for readability",
  },

  {
    id: "nunito",
    name: "Nunito",
    displayName: "Nunito",
    fontFamily: "Nunito, sans-serif",
    category: "stylish",
    description: "Well-balanced rounded sans",
  },
  {
    id: "comfortaa",
    name: "Comfortaa",
    displayName: "Comfortaa",
    fontFamily: "Comfortaa, sans-serif",
    category: "stylish",
    description: "Relaxed geometric with rounded edges",
  },
  {
    id: "kalam",
    name: "Kalam",
    displayName: "Kalam",
    fontFamily: "Kalam, cursive",
    category: "artistic",
    description: "Handwriting with a personal touch",
  },

  {
    id: "orbitron",
    name: "Orbitron",
    displayName: "Orbitron",
    fontFamily: "Orbitron, monospace",
    category: "artistic",
    description: "Futuristic geometric display",
  },
  {
    id: "righteous",
    name: "Righteous",
    displayName: "Righteous",
    fontFamily: "Righteous, cursive",
    category: "artistic",
    description: "Bold and impactful display",
  },
];

interface FontStore {
  selectedFont: string;
  setFont: (fontId: string) => void;
  getCurrentFont: () => FontOption;
  applyFont: (fontId: string) => void;
}

export const useFontStore = create<FontStore>()(
  persist(
    (set, get) => ({
      selectedFont: "geist",

      setFont: (fontId: string) => {
        const font = FONT_OPTIONS.find((f) => f.id === fontId);
        if (font) {
          set({ selectedFont: fontId });
          get().applyFont(fontId);
        }
      },

      getCurrentFont: () => {
        const { selectedFont } = get();
        return (
          FONT_OPTIONS.find((f) => f.id === selectedFont) || FONT_OPTIONS[0]
        );
      },

      applyFont: (fontId: string) => {
        const font = FONT_OPTIONS.find((f) => f.id === fontId);
        if (font) {
          // Update CSS variables for both light and dark themes
          const root = document.documentElement;
          root.style.setProperty("--font-sans", font.fontFamily);

          // Also update the body font-family directly for immediate effect
          document.body.style.fontFamily = font.fontFamily;
        }
      },
    }),
    {
      name: "font-preferences",
    }
  )
);
