'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CollectionFilterValue } from '@/components/strategy/CollectionControls';
import {
  filterHistoryEntries,
  isHistoryFilterActive,
} from '@/lib/scripts/history-filter';
import { partitionScriptsByStarred } from '@/lib/scripts/history-list';
import type { SavedScript } from '@/lib/types';

export function useHistoryFilters(entries: readonly SavedScript[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [activeCollectionFilter, setActiveCollectionFilter] =
    useState<CollectionFilterValue>(undefined);

  const filteredEntries = useMemo(
    () =>
      filterHistoryEntries(entries, {
        q: searchQuery,
        tags: activeTagFilters,
        collectionId: activeCollectionFilter,
      }),
    [entries, searchQuery, activeTagFilters, activeCollectionFilter],
  );

  const { starred, unstarred } = useMemo(
    () => partitionScriptsByStarred(filteredEntries),
    [filteredEntries],
  );

  const filtersActive = isHistoryFilterActive({
    q: searchQuery,
    tags: activeTagFilters,
    collectionId: activeCollectionFilter,
  });

  const toggleTagFilter = useCallback((tag: string) => {
    setActiveTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveTagFilters([]);
    setActiveCollectionFilter(undefined);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    activeTagFilters,
    activeCollectionFilter,
    setActiveCollectionFilter,
    filteredEntries,
    starred,
    unstarred,
    filtersActive,
    toggleTagFilter,
    clearFilters,
  };
}
