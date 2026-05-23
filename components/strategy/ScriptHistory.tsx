'use client';

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { HistoryEntryList } from '@/components/strategy/HistoryEntryList';
import { HistoryFilterBar } from '@/components/strategy/HistoryFilterBar';
import { useCollections } from '@/hooks/useCollections';
import { useScriptHistory } from '@/hooks/useScriptHistory';
import { useHistoryEntryEditing } from '@/hooks/strategy/useHistoryEntryEditing';
import { useHistoryFilters } from '@/hooks/strategy/useHistoryFilters';
import type { SavedScript } from '@/lib/types';
import { cn } from '@/lib/utils';
import { terminalActivePressed } from '@/lib/ui/terminal-texture';

type ScriptHistoryProps = {
  onLoad: (entry: SavedScript) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScriptHistory({ onLoad, open, onOpenChange }: ScriptHistoryProps) {
  const { isSignedIn, isLoaded } = useUser();
  const {
    entries,
    renameEntry,
    deleteEntry,
    toggleStarEntry,
    setTagsEntry,
    setCollectionEntry,
    refreshEntries,
  } = useScriptHistory();
  const {
    collections,
    useApi: collectionsApi,
    createCollection,
    renameCollection,
    deleteCollection,
  } = useCollections();

  const editing = useHistoryEntryEditing({
    renameEntry,
    deleteEntry,
    toggleStarEntry,
    setTagsEntry,
    setCollectionEntry,
  });

  const filters = useHistoryFilters(entries);

  const collectionNameById = useMemo(
    () => new Map(collections.map((c) => [c.id, c.name] as const)),
    [collections],
  );

  const handleDeleteCollection = async (id: number): Promise<boolean> => {
    const ok = await deleteCollection(id);
    if (ok) {
      await refreshEntries();
    }
    return ok;
  };

  const sheetDescription =
    isLoaded && isSignedIn
      ? 'Saved to your account. Organize scripts into collections and pin important ones.'
      : 'Saved on this device. Pin scripts to keep them when history is full. Sign in to use collections.';

  const closeSheet = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'pf-nav-muted border-zinc-700/70 focus-visible:ring-emerald-400/30 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300',
            open && terminalActivePressed,
          )}
          aria-label="Open script history"
        >
          <Clock className="h-3.5 w-3.5" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton
        className={cn(
          'pf-history-sheet w-full p-0 sm:max-w-[min(100vw,20rem)]',
          'data-[side=left]:w-full data-[side=left]:sm:w-80',
        )}
      >
        <SheetHeader className="border-b border-zinc-200 p-4 text-left sm:p-6 dark:border-zinc-800/70">
          <SheetTitle className="pf-heading text-lg">Script history</SheetTitle>
          <SheetDescription className="pf-muted">{sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {entries.length === 0 ? (
            <p className="pf-muted px-4 py-8 text-center text-sm sm:px-6">
              No saved scripts yet. Generate your first one.
            </p>
          ) : (
            <>
              <HistoryFilterBar
                searchQuery={filters.searchQuery}
                onSearchQueryChange={filters.setSearchQuery}
                activeTagFilters={filters.activeTagFilters}
                onToggleTagFilter={filters.toggleTagFilter}
                onClearFilters={filters.clearFilters}
                collectionsEnabled={collectionsApi}
                collections={collections}
                activeCollectionFilter={filters.activeCollectionFilter}
                onCollectionFilterChange={filters.setActiveCollectionFilter}
                onCreateCollection={createCollection}
                onRenameCollection={renameCollection}
                onDeleteCollection={handleDeleteCollection}
              />
              {filters.filteredEntries.length === 0 ? (
                <div className="flex flex-1 flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
                  <p className="pf-muted text-sm">
                    No scripts match these filters.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="pf-history-action h-8"
                    onClick={filters.clearFilters}
                    disabled={!filters.filtersActive}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <HistoryEntryList
                  starred={filters.starred}
                  unstarred={filters.unstarred}
                  editing={editing}
                  activeTagFilters={filters.activeTagFilters}
                  collections={collections}
                  collectionsEnabled={collectionsApi}
                  collectionNameById={collectionNameById}
                  onLoad={onLoad}
                  onClose={closeSheet}
                  onToggleTagFilter={filters.toggleTagFilter}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
