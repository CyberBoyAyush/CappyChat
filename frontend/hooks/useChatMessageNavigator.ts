import { useCallback, useRef, useState } from 'react';

type ScrollContainerRef = { current: HTMLElement | null } | null | undefined;

export const useChatMessageNavigator = (
  containerRef?: ScrollContainerRef
) => {
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const registerRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    messageRefs.current[id] = ref;
  }, []);

  const scrollToMessage = useCallback((id: string) => {
    const ref = messageRefs.current[id];
    if (ref) {
      const container = containerRef?.current;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const messageRect = ref.getBoundingClientRect();
        const offsetFromTop = messageRect.top - containerRect.top;
        const centeredOffset =
          offsetFromTop - container.clientHeight / 2 + ref.clientHeight / 2;

        const desiredTop = container.scrollTop + centeredOffset;
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        const clampedTop = Math.min(
          Math.max(0, desiredTop),
          Math.max(0, maxScrollTop)
        );

        container.scrollTo({
          top: clampedTop,
          behavior: 'smooth',
        });
      } else {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [containerRef]);

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
