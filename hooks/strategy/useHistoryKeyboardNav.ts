'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SavedScript } from '@/lib/types';
import type { useHistoryEntryEditing } from '@/hooks/strategy/useHistoryEntryEditing';

type UseHistoryKeyboardNavOptions = {
  open: boolean;
  starred: SavedScript[];
  unstarred: SavedScript[];
  onOpenChange: (open: boolean) => void;
  onLoad: (entry: SavedScript) => void;
  editing: ReturnType<typeof useHistoryEntryEditing>;
};

function clampIndex(index: number | null, length: number): number | null {
  if (index == null || length === 0) return null;
  if (index >= length) return length - 1;
  return index;
}

/**
 * j/k/Enter/d/s keyboard navigation for the script history drawer (spec 68).
 */
export function useHistoryKeyboardNav({
  open,
  starred,
  unstarred,
  onOpenChange,
  onLoad,
  editing,
}: UseHistoryKeyboardNavOptions) {
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] = useState<number | null>(null);

  const visibleEntries = useMemo(
    () => [...starred, ...unstarred],
    [starred, unstarred],
  );

  const activeIndex = useMemo(
    () => (open ? clampIndex(keyboardSelectedIndex, visibleEntries.length) : null),
    [open, keyboardSelectedIndex, visibleEntries.length],
  );

  const resetSelection = useCallback(() => {
    setKeyboardSelectedIndex(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;

      const target = e.target as HTMLElement | null;
      const typing =
        target != null &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      if (typing) return;

      const len = visibleEntries.length;
      if (len === 0) return;

      if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setKeyboardSelectedIndex((prev) => {
          const current = clampIndex(prev, len) ?? -1;
          return (current + 1) % len;
        });
        return;
      }

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setKeyboardSelectedIndex((prev) => {
          const current = clampIndex(prev, len) ?? len;
          return (current - 1 + len) % len;
        });
        return;
      }

      if (e.key === 'Enter') {
        if (activeIndex != null) {
          e.preventDefault();
          const entry = visibleEntries[activeIndex];
          if (entry) {
            onLoad(entry);
          }
        }
        return;
      }

      if (e.key.toLowerCase() === 'd') {
        if (activeIndex != null) {
          e.preventDefault();
          const entry = visibleEntries[activeIndex];
          if (entry && window.confirm('Delete this script from history?')) {
            editing.deleteEntry(entry.id);
            setKeyboardSelectedIndex(null);
          }
        }
        return;
      }

      if (e.key.toLowerCase() === 's') {
        if (activeIndex != null) {
          e.preventDefault();
          const entry = visibleEntries[activeIndex];
          if (entry) {
            editing.star.handleToggleStar(entry);
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, visibleEntries, activeIndex, onOpenChange, onLoad, editing]);

  const keyboardSelectedId =
    activeIndex != null ? (visibleEntries[activeIndex]?.id ?? null) : null;

  return { keyboardSelectedId, resetSelection };
}