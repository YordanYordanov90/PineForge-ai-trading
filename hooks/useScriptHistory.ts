'use client';

import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { MAX_HISTORY_ENTRIES } from '@/lib/config/constants';
import { savedScriptToCreatePayload } from '@/lib/db/script-mapper';
import { capScriptHistory } from '@/lib/scripts/history-list';
import type { GrokModelId, SavedScript } from '@/lib/types';

export const STORAGE_KEY = 'pineforge:history';
const MUTATION_EVENT = 'pineforge:history-mutated';
const MIGRATION_DONE_KEY = 'pineforge_migration_done';

const LEGACY_STORAGE_KEY = 'grokts:history';
const LEGACY_MIGRATION_DONE_KEY = 'grokts_migration_done';

function migrateLegacyLocalStorageKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const legacyHistory = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyHistory) {
        localStorage.setItem(STORAGE_KEY, legacyHistory);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (
      localStorage.getItem(MIGRATION_DONE_KEY) !== '1' &&
      localStorage.getItem(LEGACY_MIGRATION_DONE_KEY) === '1'
    ) {
      localStorage.setItem(MIGRATION_DONE_KEY, '1');
      localStorage.removeItem(LEGACY_MIGRATION_DONE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

migrateLegacyLocalStorageKeys();

const savedScriptSchema = z.object({
  id: z.string(),
  name: z.string(),
  prompt: z.string(),
  balance: z.string(),
  script: z.string(),
  createdAt: z.string(),
  version: z.number(),
  parentId: z.string().optional(),
  model: z
    .enum(['grok-4-1-fast-reasoning', 'grok-4-1-fast-non-reasoning', 'grok-4'])
    .optional(),
  market: z.string().optional(),
  timeframe: z.string().optional(),
  direction: z.string().optional(),
  indicators: z.array(z.string()).optional(),
  rr: z.string().optional(),
  isStarred: z.boolean().default(false),
});

const savedScriptArraySchema = z.array(savedScriptSchema);

/** Stable empty snapshot — useSyncExternalStore requires referential stability for server + empty client state */
const EMPTY_SNAPSHOT: SavedScript[] = [];

let cachedSerialized: string | null = null;
let cachedParsed: SavedScript[] = EMPTY_SNAPSHOT;

let apiEntries: SavedScript[] = EMPTY_SNAPSHOT;
const apiListeners = new Set<() => void>();

function invalidateHistoryCache() {
  cachedSerialized = null;
}

function readLocalHistory(): SavedScript[] {
  if (typeof window === 'undefined') return EMPTY_SNAPSHOT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const normalized = raw ?? '';
    if (normalized === cachedSerialized) {
      return cachedParsed;
    }
    cachedSerialized = normalized;
    if (!normalized) {
      cachedParsed = EMPTY_SNAPSHOT;
      return cachedParsed;
    }
    const parsed: unknown = JSON.parse(normalized);
    const validated = savedScriptArraySchema.safeParse(parsed);
    if (!validated.success) {
      cachedParsed = EMPTY_SNAPSHOT;
      return cachedParsed;
    }
    cachedParsed = validated.data;
    return cachedParsed;
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cachedSerialized = raw ?? '';
    } catch {
      cachedSerialized = null;
    }
    cachedParsed = EMPTY_SNAPSHOT;
    return cachedParsed;
  }
}

function writeLocalHistory(entries: SavedScript[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(entries);
    localStorage.setItem(STORAGE_KEY, serialized);
    cachedSerialized = serialized;
    cachedParsed = entries;
    window.dispatchEvent(new CustomEvent(MUTATION_EVENT));
    return true;
  } catch {
    return false;
  }
}

function clearLocalHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    invalidateHistoryCache();
    cachedParsed = EMPTY_SNAPSHOT;
    cachedSerialized = '';
    window.dispatchEvent(new CustomEvent(MUTATION_EVENT));
  } catch {
    // ignore
  }
}

function setApiEntries(
  next: SavedScript[] | ((prev: SavedScript[]) => SavedScript[]),
) {
  apiEntries = typeof next === 'function' ? next(apiEntries) : next;
  for (const listener of apiListeners) {
    listener();
  }
}

function subscribeLocal(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      invalidateHistoryCache();
      callback();
    }
  };
  const onMutate = () => callback();

  window.addEventListener('storage', onStorage);
  window.addEventListener(MUTATION_EVENT, onMutate);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(MUTATION_EVENT, onMutate);
  };
}

function subscribeApi(callback: () => void) {
  apiListeners.add(callback);
  return () => {
    apiListeners.delete(callback);
  };
}

function getServerSnapshot(): SavedScript[] {
  return EMPTY_SNAPSHOT;
}

async function fetchApiScripts(): Promise<SavedScript[]> {
  const res = await fetch('/api/scripts', { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load script history');
  }
  const data: unknown = await res.json();
  const scripts = z.object({ scripts: savedScriptArraySchema }).safeParse(data);
  if (!scripts.success) {
    throw new Error('Invalid script history response');
  }
  return scripts.data.scripts;
}

async function syncUserAccount(): Promise<boolean> {
  const res = await fetch('/api/users/sync', { method: 'POST' });
  return res.ok;
}

async function postApiScript(entry: SavedScript): Promise<SavedScript> {
  const payload = savedScriptToCreatePayload(entry);

  const request = () =>
    fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  let res = await request();
  if (res.status === 404) {
    const synced = await syncUserAccount();
    if (synced) {
      res = await request();
    }
  }

  if (!res.ok) {
    throw new Error('Failed to save script');
  }
  const data: unknown = await res.json();
  const parsed = z.object({ script: savedScriptSchema }).safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid save script response');
  }
  return parsed.data.script;
}

async function migrateLocalEntriesToApi(
  localEntries: SavedScript[],
): Promise<void> {
  const idMap = new Map<string, string>();
  const sorted = [...localEntries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const roots = sorted.filter((e) => e.version === 1 || !e.parentId);
  const children = sorted.filter((e) => e.parentId && e.version > 1);

  for (const entry of roots) {
    const created = await postApiScript({ ...entry, parentId: undefined });
    idMap.set(entry.id, created.id);
  }

  for (const entry of children) {
    const mappedParent = entry.parentId ? idMap.get(entry.parentId) : undefined;
    await postApiScript({
      ...entry,
      parentId: mappedParent,
    });
  }
}

export function buildSavedScriptFromGeneration(params: {
  prompt: string;
  balance: string;
  script: string;
  model: GrokModelId;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
}): SavedScript {
  const trim = params.prompt.trim();
  const base =
    trim.length <= 40 ? trim : `${trim.slice(0, 40)}…`;
  return {
    id: crypto.randomUUID(),
    name: base || 'Untitled strategy',
    prompt: params.prompt,
    balance: params.balance,
    script: params.script,
    createdAt: new Date().toISOString(),
    version: 1,
    model: params.model,
    market: params.market,
    timeframe: params.timeframe,
    direction: params.direction,
    indicators: params.indicators,
    rr: params.rr,
    isStarred: false,
  };
}

export function buildSavedScriptFromRefinement(params: {
  name: string;
  prompt: string;
  balance: string;
  script: string;
  model: GrokModelId;
  version: number;
  parentId: string;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
}): SavedScript {
  return {
    id: crypto.randomUUID(),
    name: params.name.trim() || 'Untitled strategy',
    prompt: params.prompt,
    balance: params.balance,
    script: params.script,
    createdAt: new Date().toISOString(),
    version: params.version,
    parentId: params.parentId,
    model: params.model,
    market: params.market,
    timeframe: params.timeframe,
    direction: params.direction,
    indicators: params.indicators,
    rr: params.rr,
    isStarred: false,
  };
}

export function useScriptHistory() {
  const { isSignedIn, isLoaded } = useUser();
  const useApi = isLoaded && isSignedIn;
  const migrationOfferedRef = useRef(false);

  const localEntries = useSyncExternalStore(
    subscribeLocal,
    readLocalHistory,
    getServerSnapshot,
  );

  const apiSnapshot = useSyncExternalStore(
    subscribeApi,
    () => apiEntries,
    getServerSnapshot,
  );

  const entries = useApi ? apiSnapshot : localEntries;

  const refreshApiEntries = useCallback(async () => {
    const next = await fetchApiScripts();
    setApiEntries(next);
  }, []);

  useEffect(() => {
    if (!useApi) return;

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
  }, [useApi]);

  useEffect(() => {
    if (!useApi || migrationOfferedRef.current) return;
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
              await refreshApiEntries();
              toast.success('Scripts imported to your account');
            } catch {
              toast.error('Import failed. Try again from history.');
            }
          })();
        },
      },
      duration: 12_000,
    });
  }, [useApi, refreshApiEntries]);

  const addEntry = useCallback(
    async (entry: SavedScript): Promise<SavedScript | undefined> => {
      if (useApi) {
        try {
          const created = await postApiScript(entry);
          setApiEntries((prev) =>
            capScriptHistory([created, ...prev.filter((e) => e.id !== created.id)]),
          );
          return created;
        } catch {
          toast.error('Could not save script to your account');
          return undefined;
        }
      }

      const current = readLocalHistory();
      const next = [entry, ...current].slice(0, MAX_HISTORY_ENTRIES);
      writeLocalHistory(next);
      return entry;
    },
    [useApi],
  );

  const renameEntry = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      if (useApi) {
        void (async () => {
          try {
            const res = await fetch(`/api/scripts/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: trimmed }),
            });
            if (!res.ok) {
              throw new Error('Rename failed');
            }
            const data: unknown = await res.json();
            const parsed = z.object({ script: savedScriptSchema }).safeParse(data);
            if (!parsed.success) {
              throw new Error('Invalid rename response');
            }
            const updated = parsed.data.script;
            setApiEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
          } catch {
            toast.error('Could not rename script');
          }
        })();
        return;
      }

      const current = readLocalHistory();
      const next = current.map((e) =>
        e.id === id ? { ...e, name: trimmed } : e,
      );
      writeLocalHistory(next);
    },
    [useApi],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      if (useApi) {
        void (async () => {
          try {
            const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
              throw new Error('Delete failed');
            }
            setApiEntries((prev) => prev.filter((e) => e.id !== id));
          } catch {
            toast.error('Could not delete script');
          }
        })();
        return;
      }

      const current = readLocalHistory();
      const next = current.filter((e) => e.id !== id);
      writeLocalHistory(next);
    },
    [useApi],
  );

  const toggleStarEntry = useCallback(
    async (id: string, isStarred: boolean): Promise<void> => {
      if (useApi) {
        try {
          const res = await fetch(`/api/scripts/${id}/star`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isStarred }),
          });
          if (!res.ok) {
            throw new Error('Star toggle failed');
          }
          const data: unknown = await res.json();
          const parsed = z.object({ script: savedScriptSchema }).safeParse(data);
          if (!parsed.success) {
            throw new Error('Invalid star toggle response');
          }
          const updated = parsed.data.script;
          setApiEntries((prev) =>
            capScriptHistory(prev.map((e) => (e.id === id ? updated : e))),
          );
        } catch {
          toast.error('Could not update pinned state');
        }
        return;
      }

      const current = readLocalHistory();
      const next = current.map((e) => (e.id === id ? { ...e, isStarred } : e));
      writeLocalHistory(capScriptHistory(next));
    },
    [useApi],
  );

  return { entries, addEntry, renameEntry, deleteEntry, toggleStarEntry };
}
