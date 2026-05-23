import { z } from 'zod';

export const STORAGE_KEY = 'pineforge:history';
const MUTATION_EVENT = 'pineforge:history-mutated';
export const MIGRATION_DONE_KEY = 'pineforge_migration_done';

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

export const savedScriptSchema = z.object({
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
  tags: z.array(z.string()).default([]),
  collectionId: z.number().int().nullable().default(null),
});

export const savedScriptArraySchema = z.array(savedScriptSchema);

/** Stable empty snapshot — useSyncExternalStore requires referential stability for server + empty client state */
const EMPTY_SNAPSHOT: z.infer<typeof savedScriptArraySchema> = [];

let cachedSerialized: string | null = null;
let cachedParsed: z.infer<typeof savedScriptArraySchema> = EMPTY_SNAPSHOT;

function invalidateHistoryCache() {
  cachedSerialized = null;
}

export function readLocalHistory(): z.infer<typeof savedScriptArraySchema> {
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

export function writeLocalHistory(
  entries: z.infer<typeof savedScriptArraySchema>,
): boolean {
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

export function clearLocalHistory(): void {
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

export function subscribeLocal(callback: () => void) {
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

export function getServerSnapshot(): z.infer<typeof savedScriptArraySchema> {
  return EMPTY_SNAPSHOT;
}
