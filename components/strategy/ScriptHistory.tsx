'use client';

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Clock, GitCompare, Loader2 } from 'lucide-react';
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
import { useHistoryKeyboardNav } from '@/hooks/strategy/useHistoryKeyboardNav';
import { useScriptComparisonSelection } from '@/hooks/strategy/useScriptComparisonSelection';
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

  const comparison = useScriptComparisonSelection({ onOpenChange });

  const keyboardNav = useHistoryKeyboardNav({
    open,
    starred: filters.starred,
    unstarred: filters.unstarred,
    onOpenChange,
    onLoad,
    editing,
  });

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

  const closeSheet = () => {
    if (comparison.isComparing) return;
    comparison.clearSelection();
    keyboardNav.resetSelection();
    onOpenChange(false);
  };

  const handleSheetOpenChange = (next: boolean) => {
    if (!next) {
      if (comparison.isComparing) return;
      keyboardNav.resetSelection();
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'pf-nav-muted border-zinc-700/70 focus-visible:ring-neon-400/30 dark:hover:border-neon-500/40 dark:hover:bg-neon-500/10 dark:hover:text-neon-300',
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
                  selectedIds={comparison.selectedIds}
                  onToggleSelect={comparison.toggleSelect}
                  keyboardSelectedId={keyboardNav.keyboardSelectedId}
                />
              )}

              {comparison.selectedCount > 0 && (
                <div
                  className="border-t border-zinc-800 bg-[#0a0a0a] p-3"
                  aria-busy={comparison.isComparing}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">
                      {comparison.isComparing
                        ? 'Generating report…'
                        : `${comparison.selectedCount} selected for comparison`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={comparison.clearSelection}
                        disabled={comparison.isComparing}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void comparison.handleCompareSelected()}
                        disabled={!comparison.canCompare || comparison.isComparing}
                        aria-live="polite"
                        className="h-8 bg-neon-500/90 text-black hover:bg-neon-400 disabled:opacity-50"
                      >
                        {comparison.isComparing ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <GitCompare className="mr-1.5 h-3.5 w-3.5" />
                            Compare Selected
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {!comparison.isComparing && !comparison.canCompare && comparison.selectedCount === 1 && (
                    <p className="mt-1 text-[10px] text-amber-400/80">Select 1 more script to compare.</p>
                  )}
                  {!comparison.isComparing && comparison.selectedCount > 3 && (
                    <p className="mt-1 text-[10px] text-rose-400/80">Maximum 3 scripts for a comparison.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}