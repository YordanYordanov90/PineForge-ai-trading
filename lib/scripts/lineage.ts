import type { SavedScript } from '@/lib/types';

/** Entries belonging to one strategy lineage (v1 root + refinements). */
export function getScriptsInLineage(
  entries: readonly SavedScript[],
  rootId: string,
): SavedScript[] {
  return entries
    .filter((e) => e.id === rootId || e.parentId === rootId)
    .sort((a, b) => a.version - b.version);
}

/** Script text for version `lastVersion - 1`, or null if unavailable. */
export function getPreviousVersionScript(
  entries: readonly SavedScript[],
  rootId: string,
  lastVersion: number,
): string | null {
  if (lastVersion < 2) return null;
  const prev = getScriptsInLineage(entries, rootId).find((e) => e.version === lastVersion - 1);
  return prev?.script ?? null;
}
