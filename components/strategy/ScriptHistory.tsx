'use client';

import { useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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
import type { SavedScript } from '@/lib/types';
import { cn } from '@/lib/utils';
import { terminalActivePressed } from '@/lib/ui/terminal-texture';
import { toast } from 'sonner';

type ScriptHistoryProps = {
  onLoad: (entry: SavedScript) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScriptHistory({ onLoad, open, onOpenChange }: ScriptHistoryProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
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

  // Multi-select for Comparison Reports (spec 63) — max 3 scripts
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isComparing, setIsComparing] = useState(false);
  const selectedCount = selectedIds.size;
  const canCompare = selectedCount >= 2 && selectedCount <= 3;

  const toggleSelect = (id: number) => {
    if (isComparing) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 3) {
          toast.info('Compare up to 3 strategies at a time');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCompareSelected = async () => {
    if (!canCompare || isComparing) return;
    const scriptIds = Array.from(selectedIds).sort((a, b) => a - b);
    setIsComparing(true);
    const toastId = toast.loading('Generating comparison report…', {
      description: 'Forge is analysing your strategies. This usually takes 10–30 seconds.',
    });
    try {
      const res = await fetch('/api/comparison-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptIds }),
      });
      const json = await res.json();
      if (json.success && json.data?.report) {
        toast.success('Comparison report generated', { id: toastId });
        clearSelection();
        onOpenChange(false);
        router.push('/reports');
      } else {
        toast.error(json.error ?? 'Failed to create comparison report', { id: toastId });
      }
    } catch {
      toast.error('Comparison failed. Please try again.', { id: toastId });
    } finally {
      setIsComparing(false);
    }
  };

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
    if (isComparing) return;
    clearSelection();
    onOpenChange(false);
  };

  const handleSheetOpenChange = (next: boolean) => {
    if (!next && isComparing) return;
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
                  // Comparison multi-select (spec 63)
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              )}

              {/* Compare footer (spec 63) — appears when 2–3 scripts selected */}
              {selectedCount > 0 && (
                <div
                  className="border-t border-zinc-800 bg-[#0a0a0a] p-3"
                  aria-busy={isComparing}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">
                      {isComparing
                        ? 'Generating report…'
                        : `${selectedCount} selected for comparison`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={clearSelection}
                        disabled={isComparing}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCompareSelected}
                        disabled={!canCompare || isComparing}
                        aria-live="polite"
                        className="h-8 bg-neon-500/90 text-black hover:bg-neon-400 disabled:opacity-50"
                      >
                        {isComparing ? (
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
                  {!isComparing && !canCompare && selectedCount === 1 && (
                    <p className="mt-1 text-[10px] text-amber-400/80">Select 1 more script to compare.</p>
                  )}
                  {!isComparing && selectedCount > 3 && (
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
