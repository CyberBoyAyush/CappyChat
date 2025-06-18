/**
 * Web Search Store
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Manages web search toggle state and ensures model selection consistency.
 * When web search is enabled, automatically switches to OpenAI 4.1 Mini Search model.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useModelStore } from './ChatModelStore';

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

        // When web search is enabled, switch to OpenAI 4.1 Mini Search (default)
        // When disabled, switch back to regular OpenAI 4.1 Mini
        const modelStore = useModelStore.getState();
        if (enabled) {
          modelStore.setModel('OpenAI 4.1 Mini Search');
        } else {
          // Only switch back if currently using a search model
          if (modelStore.selectedModel === 'OpenAI 4.1 Mini Search' || modelStore.selectedModel === 'Gemini 2.5 Flash Search') {
            modelStore.setModel('OpenAI 4.1 Mini');
          }
        }
      },

      toggleWebSearch: () => {
        const { isWebSearchEnabled } = get();
        get().setWebSearchEnabled(!isWebSearchEnabled);
      },

      resetForGuest: () => {
        // Disable web search for guest users and reset to OpenAI 4.1 Mini
        set({ isWebSearchEnabled: false });
        const modelStore = useModelStore.getState();
        if (modelStore.selectedModel === 'OpenAI 4.1 Mini Search' || modelStore.selectedModel === 'Gemini 2.5 Flash Search') {
          modelStore.setModel('OpenAI 4.1 Mini');
        }
      },
    }),
    {
      name: 'web-search-enabled',
      partialize: (state) => ({ isWebSearchEnabled: state.isWebSearchEnabled }),
    }
  )
);
