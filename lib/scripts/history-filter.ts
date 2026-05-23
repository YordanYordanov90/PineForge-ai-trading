import type { SavedScript } from '@/lib/types';

export type HistoryFilter = {
  /** Free-text query; matched against `name` + `prompt` (case-insensitive). */
  q?: string;
  /**
   * Already-normalized tag list. AND-semantics: an entry must contain
   * **every** active tag to match (mirrors the server's jsonb `@>`
   * containment behavior in spec 42).
   */
  tags?: string[];
  /**
   * Collection filter (spec 47). A positive id matches
   * `entry.collectionId`; `'uncategorized'` matches entries with
   * `collectionId === null`. Omitted = no collection filter.
   */
  collectionId?: number | 'uncategorized';
};

function matchesText(entry: SavedScript, q: string): boolean {
  const haystack = `${entry.name}\n${entry.prompt}`.toLowerCase();
  return haystack.includes(q);
}

function matchesAllTags(entry: SavedScript, required: readonly string[]): boolean {
  if (required.length === 0) return true;
  const entryTagSet = new Set(entry.tags);
  for (const tag of required) {
    if (!entryTagSet.has(tag)) return false;
  }
  return true;
}

/**
 * Client-side history filter (spec 43). Pure and deterministic — safe to
 * use directly in render. Mirrors the server semantics from spec 42:
 * - text match is case-insensitive substring across `name` + `prompt`
 * - tag match is AND-containment against the entry's normalized tag list
 *
 * The signed-in history list is already capped at
 * `MAX_HISTORY_ENTRIES` + all starred rows, and the signed-out list is
 * capped at `MAX_HISTORY_ENTRIES`, so filtering in-memory stays cheap.
 * The dedicated server route (`GET /api/scripts/search`) remains
 * available for cross-session lookups beyond the cached window.
 */
function matchesCollection(
  entry: SavedScript,
  collectionFilter: HistoryFilter['collectionId'],
): boolean {
  if (collectionFilter === undefined) return true;
  if (collectionFilter === 'uncategorized') {
    return entry.collectionId == null;
  }
  return entry.collectionId === collectionFilter;
}

export function filterHistoryEntries(
  entries: readonly SavedScript[],
  filter: HistoryFilter,
): SavedScript[] {
  const q = filter.q?.trim().toLowerCase() ?? '';
  const tags = filter.tags ?? [];
  const collectionFilter = filter.collectionId;
  if (
    q.length === 0 &&
    tags.length === 0 &&
    collectionFilter === undefined
  ) {
    return [...entries];
  }
  return entries.filter(
    (entry) =>
      (q.length === 0 || matchesText(entry, q)) &&
      matchesAllTags(entry, tags) &&
      matchesCollection(entry, collectionFilter),
  );
}

/** True when any history filter input is active. */
export function isHistoryFilterActive(filter: HistoryFilter): boolean {
  const qActive = (filter.q?.trim().length ?? 0) > 0;
  const tagsActive = (filter.tags?.length ?? 0) > 0;
  const collectionActive = filter.collectionId !== undefined;
  return qActive || tagsActive || collectionActive;
}
