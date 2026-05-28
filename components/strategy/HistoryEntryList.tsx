'use client';

import { HistoryEntry } from '@/components/strategy/HistoryEntry';
import type { useHistoryEntryEditing } from '@/hooks/strategy/useHistoryEntryEditing';
import type { SavedCollection, SavedScript } from '@/lib/types';

type HistoryEditing = ReturnType<typeof useHistoryEntryEditing>;

type HistoryEntryListProps = {
  starred: readonly SavedScript[];
  unstarred: readonly SavedScript[];
  editing: HistoryEditing;
  activeTagFilters: readonly string[];
  collections: readonly SavedCollection[];
  collectionsEnabled: boolean;
  collectionNameById: ReadonlyMap<number, string>;
  onLoad: (entry: SavedScript) => void;
  onClose: () => void;
  onToggleTagFilter: (tag: string) => void;
  // Multi-select for comparison reports (spec 63)
  selectedIds?: ReadonlySet<number>;
  onToggleSelect?: (id: number) => void;
};

export function HistoryEntryList({
  starred,
  unstarred,
  editing,
  activeTagFilters,
  collections,
  collectionsEnabled,
  collectionNameById,
  onLoad,
  onClose,
  onToggleTagFilter,
  selectedIds,
  onToggleSelect,
}: HistoryEntryListProps) {
  const entryCommon = {
    editing,
    activeTagFilters,
    collections,
    collectionsEnabled,
    collectionNameById,
    onLoad,
    onClose,
    onToggleTagFilter,
    selectedIds,
    onToggleSelect,
  };

  return (
    <ul className="flex-1 overflow-y-auto px-2 py-3 sm:px-3">
      {starred.length > 0 ? (
        <>
          <li
            aria-hidden
            className="mb-1 list-none px-1 text-[10px] font-medium uppercase tracking-wider text-amber-600/90 dark:text-amber-400/80"
          >
            Pinned
          </li>
          {starred.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} {...entryCommon} />
          ))}
        </>
      ) : null}
      {unstarred.map((entry) => (
        <HistoryEntry key={entry.id} entry={entry} {...entryCommon} />
      ))}
    </ul>
  );
}
