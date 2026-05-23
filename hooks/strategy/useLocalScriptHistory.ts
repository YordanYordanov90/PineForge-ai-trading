'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { MAX_HISTORY_ENTRIES } from '@/lib/config/constants';
import { capScriptHistory } from '@/lib/scripts/history-list';
import {
  getServerSnapshot,
  readLocalHistory,
  subscribeLocal,
  writeLocalHistory,
} from '@/lib/scripts/local-history-store';
import { normalizeTags } from '@/lib/scripts/tags';
import type { SavedScript } from '@/lib/types';

export function useLocalScriptHistory() {
  const entries = useSyncExternalStore(
    subscribeLocal,
    readLocalHistory,
    getServerSnapshot,
  );

  const addEntry = useCallback(
    async (entry: SavedScript): Promise<SavedScript | undefined> => {
      const current = readLocalHistory();
      const next = [entry, ...current].slice(0, MAX_HISTORY_ENTRIES);
      writeLocalHistory(next);
      return entry;
    },
    [],
  );

  const renameEntry = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const current = readLocalHistory();
    const next = current.map((e) =>
      e.id === id ? { ...e, name: trimmed } : e,
    );
    writeLocalHistory(next);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    const current = readLocalHistory();
    const next = current.filter((e) => e.id !== id);
    writeLocalHistory(next);
  }, []);

  const toggleStarEntry = useCallback(
    async (id: string, isStarred: boolean): Promise<void> => {
      const current = readLocalHistory();
      const next = current.map((e) => (e.id === id ? { ...e, isStarred } : e));
      writeLocalHistory(capScriptHistory(next));
    },
    [],
  );

  const setTagsEntry = useCallback(
    async (id: string, tags: readonly string[]): Promise<void> => {
      const normalized = normalizeTags(tags);
      const current = readLocalHistory();
      const next = current.map((e) =>
        e.id === id ? { ...e, tags: normalized } : e,
      );
      writeLocalHistory(capScriptHistory(next));
    },
    [],
  );

  const setCollectionEntry = useCallback(
    async (id: string, collectionId: number | null): Promise<void> => {
      const current = readLocalHistory();
      const next = current.map((e) =>
        e.id === id ? { ...e, collectionId } : e,
      );
      writeLocalHistory(capScriptHistory(next));
    },
    [],
  );

  return {
    entries,
    addEntry,
    renameEntry,
    deleteEntry,
    toggleStarEntry,
    setTagsEntry,
    setCollectionEntry,
  };
}
