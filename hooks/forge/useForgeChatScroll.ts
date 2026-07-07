'use client';

import { useCallback, useRef, useState } from 'react';

export function useForgeChatScroll(onScrollOffset?: (offset: number) => void) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const userAwayFromBottomRef = useRef(false);
  const [showScrollFab, setShowScrollFab] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const away = distanceFromBottom > 120;
    userAwayFromBottomRef.current = away;
    setShowScrollFab(away);
    onScrollOffset?.(el.scrollTop);
  }, [onScrollOffset]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    userAwayFromBottomRef.current = false;
    setShowScrollFab(false);
  }, []);

  return {
    scrollContainerRef,
    bottomRef,
    userAwayFromBottomRef,
    showScrollFab,
    handleScroll,
    scrollToBottom,
  };
}