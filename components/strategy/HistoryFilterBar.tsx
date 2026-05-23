'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CollectionControls,
  type CollectionFilterValue,
} from '@/components/strategy/CollectionControls';
import type { SavedCollection } from '@/lib/types';

type HistoryFilterBarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeTagFilters: readonly string[];
  onToggleTagFilter: (tag: string) => void;
  onClearFilters: () => void;
  collectionsEnabled: boolean;
  collections: readonly SavedCollection[];
  activeCollectionFilter: CollectionFilterValue;
  onCollectionFilterChange: (value: CollectionFilterValue) => void;
  onCreateCollection: (name: string) => Promise<SavedCollection | undefined>;
  onRenameCollection: (id: number, name: string) => Promise<boolean>;
  onDeleteCollection: (id: number) => Promise<boolean>;
};

export function HistoryFilterBar({
  searchQuery,
  onSearchQueryChange,
  activeTagFilters,
  onToggleTagFilter,
  onClearFilters,
  collectionsEnabled,
  collections,
  activeCollectionFilter,
  onCollectionFilterChange,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
}: HistoryFilterBarProps) {
  return (
    <div className="border-b border-zinc-200 px-4 py-3 sm:px-6 dark:border-zinc-800/70">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Filter by name, prompt, or tag"
          className="pf-input h-8 pl-8 text-xs"
          aria-label="Filter history by name, prompt, or tag"
        />
      </div>
      {activeTagFilters.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {activeTagFilters.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTagFilter(tag)}
              className="inline-flex items-center gap-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:border-emerald-400/40 dark:text-emerald-300"
              aria-label={`Remove filter ${tag}`}
            >
              #{tag}
              <X className="h-2.5 w-2.5" aria-hidden />
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="pf-history-action-muted h-6 px-2 text-[10px]"
            onClick={onClearFilters}
          >
            Clear
          </Button>
        </div>
      ) : null}
      {collectionsEnabled ? (
        <div className="mt-3">
          <CollectionControls
            collections={collections}
            activeFilter={activeCollectionFilter}
            onFilterChange={onCollectionFilterChange}
            onCreate={onCreateCollection}
            onRename={onRenameCollection}
            onDelete={onDeleteCollection}
          />
        </div>
      ) : null}
    </div>
  );
}
