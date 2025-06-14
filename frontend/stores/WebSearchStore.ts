/**
 * Web Search Store
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Manages web search toggle state and ensures model selection consistency.
 * When web search is enabled, automatically switches to Gemini 2.5 Flash Search model.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useModelStore } from './ChatModelStore';

type WebSearchStore = {
  isWebSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  toggleWebSearch: () => void;
};

export const useWebSearchStore = create<WebSearchStore>()(
  persist(
    (set, get) => ({
      isWebSearchEnabled: false,

      setWebSearchEnabled: (enabled) => {
        set({ isWebSearchEnabled: enabled });
        
        // When web search is enabled, switch to Gemini 2.5 Flash Search
        // When disabled, switch back to regular Gemini 2.5 Flash
        const modelStore = useModelStore.getState();
        if (enabled) {
          modelStore.setModel('Gemini 2.5 Flash Search');
        } else {
          // Only switch back if currently using the search model
          if (modelStore.selectedModel === 'Gemini 2.5 Flash Search') {
            modelStore.setModel('Gemini 2.5 Flash');
          }
        }
      },

      toggleWebSearch: () => {
        const { isWebSearchEnabled } = get();
        get().setWebSearchEnabled(!isWebSearchEnabled);
      },
    }),
    {
      name: 'web-search-enabled',
      partialize: (state) => ({ isWebSearchEnabled: state.isWebSearchEnabled }),
    }
  )
);
