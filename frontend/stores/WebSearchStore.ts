/**
 * Web Search Store
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Manages web search toggle state for Tavily-powered web search.
 * Web search now works with any selected model via Tavily integration.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WebSearchStore = {
  isWebSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  toggleWebSearch: () => void;
  resetForGuest: () => void;
};

export const useWebSearchStore = create<WebSearchStore>()(
  persist(
    (set, get) => ({
      isWebSearchEnabled: false,

      setWebSearchEnabled: (enabled) => {
        // Note: Guest user validation is handled in the UI components
        // This store function should only be called for authenticated users
        set({ isWebSearchEnabled: enabled });

        // With Tavily integration, web search works with any model
        // No need to switch models automatically
      },

      toggleWebSearch: () => {
        const { isWebSearchEnabled } = get();
        get().setWebSearchEnabled(!isWebSearchEnabled);
      },

      resetForGuest: () => {
        // Disable web search for guest users
        set({ isWebSearchEnabled: false });
        // No need to change models since web search works with any model
      },
    }),
    {
      name: 'web-search-enabled',
      partialize: (state) => ({ isWebSearchEnabled: state.isWebSearchEnabled }),
    }
  )
);
