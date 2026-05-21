import { MAX_HISTORY_ENTRIES } from '@/lib/config/constants';
import type { SavedScript } from '@/lib/types';

function sortByCreatedAtDesc(entries: SavedScript[]): SavedScript[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Caps in-memory history: all starred entries are kept; only unstarred entries
 * beyond {@link MAX_HISTORY_ENTRIES} are trimmed. Order stays recency-based.
 */
export function capScriptHistory(entries: readonly SavedScript[]): SavedScript[] {
  const sorted = sortByCreatedAtDesc([...entries]);
  const starred = sorted.filter((e) => e.isStarred);
  const unstarred = sorted.filter((e) => !e.isStarred);
  return sortByCreatedAtDesc([
    ...starred,
    ...unstarred.slice(0, MAX_HISTORY_ENTRIES),
  ]);
}

/** Splits history for UI grouping (spec 39); preserves entry order within each bucket. */
export function partitionScriptsByStarred(entries: readonly SavedScript[]): {
  starred: SavedScript[];
  unstarred: SavedScript[];
} {
  const starred: SavedScript[] = [];
  const unstarred: SavedScript[] = [];
  for (const entry of entries) {
    if (entry.isStarred) starred.push(entry);
    else unstarred.push(entry);
  }
  return { starred, unstarred };
}
