/**
 * Search Type Store
 *
 * Used in: frontend/components/ChatInputField.tsx
 * Purpose: Manages search type selection between Web Search and Reddit Search.
 * Integrates with Tavily API for both general web search and Reddit-specific searches.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SearchType = 'chat' | 'web' | 'reddit';

export interface SearchTypeConfig {
  id: SearchType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
}

export const SEARCH_TYPE_CONFIGS: Record<SearchType, SearchTypeConfig> = {
  chat: {
    id: 'chat',
    name: 'Chat',
    description: 'Direct conversation with AI (default mode)',
    icon: 'MessageCircle',
    color: 'text-green-500',
  },
  web: {
    id: 'web',
    name: 'Web Search',
    description: 'Search across the entire web using Tavily',
    icon: 'Globe',
    color: 'text-blue-500',
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit Search',
    description: 'Search Reddit communities and discussions',
    icon: 'MessageSquare',
    color: 'text-orange-500',
  },
};

type SearchTypeStore = {
  selectedSearchType: SearchType;
  setSearchType: (type: SearchType) => void;
  getSearchConfig: () => SearchTypeConfig;
  resetForGuest: () => void;
};

export const useSearchTypeStore = create<SearchTypeStore>()(
  persist(
    (set, get) => ({
      selectedSearchType: 'chat', // Default to chat mode

      setSearchType: (type) => {
        set({ selectedSearchType: type });
      },

      getSearchConfig: () => {
        const { selectedSearchType } = get();
        return SEARCH_TYPE_CONFIGS[selectedSearchType];
      },

      resetForGuest: () => {
        // Reset to chat mode for guest users
        set({ selectedSearchType: 'chat' });
      },
    }),
    {
      name: 'search-type-store',
      partialize: (state) => ({
        selectedSearchType: state.selectedSearchType,
      }),
    }
  )
);
