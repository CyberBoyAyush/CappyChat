import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devWarn } from '@/lib/logger';

export type BYOKStore = {
  // OpenRouter API Key
  openRouterApiKey: string | null;

  // OpenAI API Key (for Whisper voice input)
  openAIApiKey: string | null;

  // Tavily API Key (for web search)
  tavilyApiKey: string | null;

  // Actions
  setOpenRouterApiKey: (key: string | null) => void;
  setOpenAIApiKey: (key: string | null) => void;
  setTavilyApiKey: (key: string | null) => void;
  hasOpenRouterKey: () => boolean;
  hasOpenAIKey: () => boolean;
  hasTavilyKey: () => boolean;
  clearAllKeys: () => void;

  // Validation
  validateOpenRouterKey: (key: string) => boolean;
  validateOpenAIKey: (key: string) => boolean;
  validateTavilyKey: (key: string) => boolean;
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

  // OpenAI keys can have multiple formats:
  // - sk-[base64-like characters] (legacy format)
  // - sk-proj-[project-id][base64-like characters] (project-scoped keys)
  // - sk-[org-id]-[base64-like characters] (organization keys)
  // Characters can include: A-Z, a-z, 0-9, hyphens, underscores
  const openAIKeyPattern = /^sk-[A-Za-z0-9_-]{20,}$/;
  return openAIKeyPattern.test(key.trim());
};

// Simple validation for Tavily API key format
const validateTavilyKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;

  // Tavily keys can have multiple formats:
  // - tvly-dev-[alphanumeric string] (development keys)
  // - tvly-[alphanumeric string] (production keys)
  // Characters can include: A-Z, a-z, 0-9
  const tavilyKeyPattern = /^tvly-(?:dev-)?[A-Za-z0-9]{20,}$/;
  return tavilyKeyPattern.test(key.trim());
};

export const useBYOKStore = create<BYOKStore>()(
  persist(
    (set, get) => ({
      openRouterApiKey: null,
      openAIApiKey: null,
      tavilyApiKey: null,

      setOpenRouterApiKey: (key) => {
        // Validate key before storing
        if (key && !validateOpenRouterKey(key)) {
          devWarn('Invalid OpenRouter API key format');
          return;
        }
        set({ openRouterApiKey: key });
      },

      setOpenAIApiKey: (key) => {
        // Validate key before storing
        if (key && !validateOpenAIKey(key)) {
          devWarn('Invalid OpenAI API key format');
          return;
        }
        set({ openAIApiKey: key });
      },

      setTavilyApiKey: (key) => {
        // Validate key before storing
        if (key && !validateTavilyKey(key)) {
          devWarn('Invalid Tavily API key format');
          return;
        }
        set({ tavilyApiKey: key });
      },

      hasOpenRouterKey: () => {
        const { openRouterApiKey } = get();
        return openRouterApiKey !== null && openRouterApiKey.length > 0;
      },

      hasOpenAIKey: () => {
        const { openAIApiKey } = get();
        return openAIApiKey !== null && openAIApiKey.length > 0;
      },

      hasTavilyKey: () => {
        const { tavilyApiKey } = get();
        return tavilyApiKey !== null && tavilyApiKey.length > 0;
      },

      clearAllKeys: () => {
        set({ openRouterApiKey: null, openAIApiKey: null, tavilyApiKey: null });
      },

      validateOpenRouterKey,
      validateOpenAIKey,
      validateTavilyKey,
    }),
    {
      name: 'byok-keys',
      partialize: (state) => ({
        openRouterApiKey: state.openRouterApiKey,
        openAIApiKey: state.openAIApiKey,
        tavilyApiKey: state.tavilyApiKey
      }),
    }
  )
);
