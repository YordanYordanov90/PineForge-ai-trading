'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { MAX_HISTORY_ENTRIES } from '@/lib/constants';
import type { GrokModelId, SavedScript } from '@/lib/types';

const STORAGE_KEY = 'grokts:history';
const MUTATION_EVENT = 'grokts:history-mutated';

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
});

const savedScriptArraySchema = z.array(savedScriptSchema);

/** Stable empty snapshot — useSyncExternalStore requires referential stability for server + empty client state */
const EMPTY_SNAPSHOT: SavedScript[] = [];

let cachedSerialized: string | null = null;
let cachedParsed: SavedScript[] = EMPTY_SNAPSHOT;

function invalidateHistoryCache() {
  cachedSerialized = null;
}

function readHistory(): SavedScript[] {
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

function writeHistory(entries: SavedScript[]): boolean {
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

function subscribe(callback: () => void) {
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

function getServerSnapshot(): SavedScript[] {
  return EMPTY_SNAPSHOT;
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
  };
}

export function useScriptHistory() {
  const entries = useSyncExternalStore(subscribe, readHistory, getServerSnapshot);

  const addEntry = useCallback((entry: SavedScript) => {
    const current = readHistory();
    const next = [entry, ...current].slice(0, MAX_HISTORY_ENTRIES);
    writeHistory(next);
  }, []);

  const renameEntry = useCallback((id: string, name: string) => {
    const current = readHistory();
    const next = current.map((e) => (e.id === id ? { ...e, name: name.trim() || e.name } : e));
    writeHistory(next);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    const current = readHistory();
    const next = current.filter((e) => e.id !== id);
    writeHistory(next);
  }, []);

  return { entries, addEntry, renameEntry, deleteEntry };
}
