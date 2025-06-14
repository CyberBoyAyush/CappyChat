import { create, Mutate, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConversationStyle, getConversationStyleConfig, ConversationStyleConfig, DEFAULT_CONVERSATION_STYLE } from '@/lib/conversationStyles';

type ConversationStyleStore = {
  selectedStyle: ConversationStyle;
  setStyle: (style: ConversationStyle) => void;
  getStyleConfig: () => ConversationStyleConfig;
};

type StoreWithPersist = Mutate<
  StoreApi<ConversationStyleStore>,
  [['zustand/persist', { selectedStyle: ConversationStyle }]]
>;

export const withStorageDOMEvents = (store: StoreWithPersist) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist.getOptions().name && e.newValue) {
      store.persist.rehydrate();
    }
  };

  window.addEventListener('storage', storageEventCallback);

  return () => {
    window.removeEventListener('storage', storageEventCallback);
  };
};

export const useConversationStyleStore = create<ConversationStyleStore>()(
  persist(
    (set, get) => ({
      selectedStyle: DEFAULT_CONVERSATION_STYLE,

      setStyle: (style) => {
        set({ selectedStyle: style });
      },

      getStyleConfig: () => {
        const { selectedStyle } = get();
        return getConversationStyleConfig(selectedStyle);
      },
    }),
    {
      name: 'conversation-style',
      partialize: (state) => ({ selectedStyle: state.selectedStyle }),
    }
  )
);

withStorageDOMEvents(useConversationStyleStore);
