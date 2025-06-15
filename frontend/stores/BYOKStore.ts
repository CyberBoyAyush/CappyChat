import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BYOKStore = {
  // OpenRouter API Key
  openRouterApiKey: string | null;
  
  // Actions
  setOpenRouterApiKey: (key: string | null) => void;
  hasOpenRouterKey: () => boolean;
  clearAllKeys: () => void;
  
  // Validation
  validateOpenRouterKey: (key: string) => boolean;
};

// Simple validation for OpenRouter API key format
const validateOpenRouterKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;

  // OpenRouter keys start with 'sk-or-' and can have various formats:
  // - sk-or-v1-[hex string] (newer format)
  // - sk-or-[base64-like characters] (older format)
  const openRouterKeyPattern = /^sk-or-(?:v\d+-)?[A-Za-z0-9+/=_-]{32,}$/;
  return openRouterKeyPattern.test(key.trim());
};

export const useBYOKStore = create<BYOKStore>()(
  persist(
    (set, get) => ({
      openRouterApiKey: null,

      setOpenRouterApiKey: (key) => {
        // Validate key before storing
        if (key && !validateOpenRouterKey(key)) {
          console.warn('Invalid OpenRouter API key format');
          return;
        }
        set({ openRouterApiKey: key });
      },

      hasOpenRouterKey: () => {
        const { openRouterApiKey } = get();
        return openRouterApiKey !== null && openRouterApiKey.length > 0;
      },

      clearAllKeys: () => {
        set({ openRouterApiKey: null });
      },

      validateOpenRouterKey,
    }),
    {
      name: 'byok-keys',
      partialize: (state) => ({ 
        openRouterApiKey: state.openRouterApiKey 
      }),
    }
  )
);
