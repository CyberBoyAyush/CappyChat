import { useCallback, useRef, useState } from 'react';

export const useChatMessageNavigator = () => {
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const registerRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    messageRefs.current[id] = ref;
  }, []);

  const scrollToMessage = useCallback((id: string) => {
    const ref = messageRefs.current[id];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleToggleNavigator = useCallback(() => {
    setIsNavigatorVisible((prev) => !prev);
  }, []);

  const closeNavigator = useCallback(() => {
    setIsNavigatorVisible(false);
  }, []);

  return {
    isNavigatorVisible,
    handleToggleNavigator,
    closeNavigator,
    registerRef,
    scrollToMessage,
  };
};
