import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BYOKStore = {
  // OpenRouter API Key
  openRouterApiKey: string | null;

  // OpenAI API Key (for Whisper voice input)
  openAIApiKey: string | null;

  // Actions
  setOpenRouterApiKey: (key: string | null) => void;
  setOpenAIApiKey: (key: string | null) => void;
  hasOpenRouterKey: () => boolean;
  hasOpenAIKey: () => boolean;
  clearAllKeys: () => void;

  // Validation
  validateOpenRouterKey: (key: string) => boolean;
  validateOpenAIKey: (key: string) => boolean;
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

// Simple validation for OpenAI API key format
const validateOpenAIKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;

  // OpenAI keys start with 'sk-' followed by base64-like characters
  // Format: sk-[project-id-]?[base64-like characters]
  const openAIKeyPattern = /^sk-(?:proj-)?[A-Za-z0-9]{20,}$/;
  return openAIKeyPattern.test(key.trim());
};

export const useBYOKStore = create<BYOKStore>()(
  persist(
    (set, get) => ({
      openRouterApiKey: null,
      openAIApiKey: null,

      setOpenRouterApiKey: (key) => {
        // Validate key before storing
        if (key && !validateOpenRouterKey(key)) {
          console.warn('Invalid OpenRouter API key format');
          return;
        }
        set({ openRouterApiKey: key });
      },

      setOpenAIApiKey: (key) => {
        // Validate key before storing
        if (key && !validateOpenAIKey(key)) {
          console.warn('Invalid OpenAI API key format');
          return;
        }
        set({ openAIApiKey: key });
      },

      hasOpenRouterKey: () => {
        const { openRouterApiKey } = get();
        return openRouterApiKey !== null && openRouterApiKey.length > 0;
      },

      hasOpenAIKey: () => {
        const { openAIApiKey } = get();
        return openAIApiKey !== null && openAIApiKey.length > 0;
      },

      clearAllKeys: () => {
        set({ openRouterApiKey: null, openAIApiKey: null });
      },

      validateOpenRouterKey,
      validateOpenAIKey,
    }),
    {
      name: 'byok-keys',
      partialize: (state) => ({
        openRouterApiKey: state.openRouterApiKey,
        openAIApiKey: state.openAIApiKey
      }),
    }
  )
);
