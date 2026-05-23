'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { capScriptHistory } from '@/lib/scripts/history-list';
import {
  deleteScriptOnApi,
  fetchApiScripts,
  getApiEntries,
  migrateLocalEntriesToApi,
  patchScriptOnApi,
  postApiScript,
  setApiEntries,
  subscribeApi,
} from '@/lib/scripts/api-history-store';
import {
  clearLocalHistory,
  getServerSnapshot,
  MIGRATION_DONE_KEY,
  readLocalHistory,
} from '@/lib/scripts/local-history-store';
import { normalizeTags } from '@/lib/scripts/tags';
import type { SavedScript } from '@/lib/types';

export function useApiScriptHistory(active: boolean) {
  const migrationOfferedRef = useRef(false);

  const entries = useSyncExternalStore(
    subscribeApi,
    getApiEntries,
    getServerSnapshot,
  );

  const refreshEntries = useCallback(async () => {
    const next = await fetchApiScripts();
    setApiEntries(next);
  }, []);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    void (async () => {
      try {
        const next = await fetchApiScripts();
        if (!cancelled) setApiEntries(next);
      } catch {
        if (!cancelled) {
          toast.error('Could not load your saved scripts');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active || migrationOfferedRef.current) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(MIGRATION_DONE_KEY) === '1') return;

    const local = readLocalHistory();
    if (local.length === 0) return;

    migrationOfferedRef.current = true;

    toast(`Import your ${local.length} saved script${local.length === 1 ? '' : 's'} to your account?`, {
      action: {
        label: 'Import',
        onClick: () => {
          void (async () => {
            try {
              await migrateLocalEntriesToApi(local);
              clearLocalHistory();
              localStorage.setItem(MIGRATION_DONE_KEY, '1');
              await refreshEntries();
              toast.success('Scripts imported to your account');
            } catch {
              toast.error('Import failed. Try again from history.');
            }
          })();
        },
      },
      duration: 12_000,
    });
  }, [active, refreshEntries]);

  const addEntry = useCallback(
    async (entry: SavedScript): Promise<SavedScript | undefined> => {
      try {
        const created = await postApiScript(entry);
        setApiEntries((prev) =>
          capScriptHistory([created, ...prev.filter((e) => e.id !== created.id)]),
        );
        return created;
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Could not save script to your account';
        toast.error(message);
        return undefined;
      }
    },
    [],
  );

  const renameEntry = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    void (async () => {
      const updated = await patchScriptOnApi(
        id,
        '',
        { title: trimmed },
        'Could not rename script',
      );
      if (!updated) return;
      setApiEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    })();
  }, []);

  const deleteEntry = useCallback((id: string) => {
    void (async () => {
      const ok = await deleteScriptOnApi(id, 'Could not delete script');
      if (!ok) return;
      setApiEntries((prev) => prev.filter((e) => e.id !== id));
    })();
  }, []);

  const toggleStarEntry = useCallback(
    async (id: string, isStarred: boolean): Promise<void> => {
      const updated = await patchScriptOnApi(
        id,
        '/star',
        { isStarred },
        'Could not update pinned state',
      );
      if (!updated) return;
      setApiEntries((prev) =>
        capScriptHistory(prev.map((e) => (e.id === id ? updated : e))),
      );
    },
    [],
  );

  const setTagsEntry = useCallback(
    async (id: string, tags: readonly string[]): Promise<void> => {
      const normalized = normalizeTags(tags);

      const updated = await patchScriptOnApi(
        id,
        '/tags',
        { tags: normalized },
        'Could not update tags',
      );
      if (!updated) return;
      setApiEntries((prev) =>
        capScriptHistory(prev.map((e) => (e.id === id ? updated : e))),
      );
    },
    [],
  );

  const setCollectionEntry = useCallback(
    async (id: string, collectionId: number | null): Promise<void> => {
      const updated = await patchScriptOnApi(
        id,
        '/collection',
        { collectionId },
        'Could not update collection',
      );
      if (!updated) return;
      setApiEntries((prev) =>
        capScriptHistory(prev.map((e) => (e.id === id ? updated : e))),
      );
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
    refreshEntries,
  };
}
