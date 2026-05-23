'use client';

import { useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  Pencil,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HistoryTagEditor } from '@/components/strategy/HistoryTagEditor';
import type { useHistoryEntryEditing } from '@/hooks/strategy/useHistoryEntryEditing';
import type { SavedCollection, SavedScript } from '@/lib/types';
import { cn } from '@/lib/utils';

function previewPrompt(prompt: string, max = 60) {
  const t = prompt.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

type HistoryEditing = ReturnType<typeof useHistoryEntryEditing>;

type HistoryEntryProps = {
  entry: SavedScript;
  editing: HistoryEditing;
  activeTagFilters: readonly string[];
  collections: readonly SavedCollection[];
  collectionsEnabled: boolean;
  collectionNameById: ReadonlyMap<number, string>;
  onLoad: (entry: SavedScript) => void;
  onClose: () => void;
  onToggleTagFilter: (tag: string) => void;
};

export function HistoryEntry({
  entry,
  editing,
  activeTagFilters,
  collections,
  collectionsEnabled,
  collectionNameById,
  onLoad,
  onClose,
  onToggleTagFilter,
}: HistoryEntryProps) {
  const { rename, tags, star, collection, deleteEntry } = editing;
  const isEditingTags = tags.tagEditingId === entry.id;
  const starPending = star.isStarPending(entry.id);
  const tagPending = tags.isTagPending(entry.id);
  const collectionPending = collection.isCollectionPending(entry.id);

  const activeFilterSet = useMemo(
    () => new Set(activeTagFilters),
    [activeTagFilters],
  );

  return (
    <li
      className={cn(
        'pf-history-entry mb-2 rounded-xl p-3 last:mb-0',
        entry.isStarred &&
          'border border-amber-500/25 bg-amber-500/[0.06] dark:border-amber-400/20',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {rename.editingId === entry.id ? (
            <Input
              value={rename.editName}
              onChange={(e) => rename.onEditNameChange(e.target.value)}
              onBlur={() => rename.commitRename(entry.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') rename.commitRename(entry.id);
                if (e.key === 'Escape') rename.cancelRename();
              }}
              className="pf-input h-8 text-sm"
              autoFocus
              aria-label="Script name"
            />
          ) : (
            <button
              type="button"
              onClick={() => rename.startRename(entry)}
              className="pf-history-entry-title w-full truncate text-left text-sm font-medium"
            >
              {entry.name}
            </button>
          )}
          <div className="pf-muted mt-1 flex flex-wrap items-center gap-2 text-xs">
            <time dateTime={entry.createdAt}>{formatSavedAt(entry.createdAt)}</time>
            <span className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700/80 dark:text-zinc-400">
              v{entry.version}
            </span>
            {entry.collectionId != null &&
            collectionNameById.has(entry.collectionId) ? (
              <span className="inline-flex items-center gap-0.5 rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-700 dark:border-sky-400/30 dark:text-sky-300">
                <Folder className="h-2.5 w-2.5 shrink-0" aria-hidden />
                {collectionNameById.get(entry.collectionId)}
              </span>
            ) : null}
          </div>
          <p className="pf-muted mt-2 line-clamp-2 text-xs leading-relaxed">
            {previewPrompt(entry.prompt)}
          </p>
          {isEditingTags ? (
            <HistoryTagEditor
              entryId={entry.id}
              value={tags.tagEditValue}
              pending={tagPending}
              onValueChange={tags.onTagEditValueChange}
              onCommit={tags.commitTags}
              onCancel={tags.cancelEditTags}
            />
          ) : entry.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {entry.tags.map((tag) => {
                const active = activeFilterSet.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTagFilter(tag)}
                    className={cn(
                      'rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors',
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-300'
                        : 'border-zinc-300 text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-600 dark:border-zinc-700/80 dark:text-zinc-400 dark:hover:text-emerald-300',
                    )}
                    aria-pressed={active}
                    aria-label={
                      active
                        ? `Remove filter ${tag}`
                        : `Filter by tag ${tag}`
                    }
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={starPending}
          className={cn(
            'h-8 w-8 shrink-0 p-0',
            entry.isStarred
              ? 'text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 dark:text-amber-400'
              : 'pf-history-action-muted',
          )}
          aria-pressed={entry.isStarred}
          aria-label={
            entry.isStarred ? `Unpin ${entry.name}` : `Pin ${entry.name}`
          }
          onClick={() => star.handleToggleStar(entry)}
        >
          <Star
            className={cn('h-4 w-4', entry.isStarred && 'fill-current')}
            aria-hidden
          />
        </Button>
      </div>
      {collectionsEnabled ? (
        <div className="mt-2">
          <label
            htmlFor={`collection-${entry.id}`}
            className="pf-muted mb-1 block text-[10px] uppercase tracking-wider"
          >
            Collection
          </label>
          <select
            id={`collection-${entry.id}`}
            value={entry.collectionId ?? ''}
            disabled={collectionPending}
            onChange={(e) => {
              const raw = e.target.value;
              collection.handleSetCollection(
                entry.id,
                raw === '' ? null : Number.parseInt(raw, 10),
              );
            }}
            className="pf-input h-8 w-full max-w-full truncate rounded-md border border-zinc-300 bg-transparent px-2 text-xs dark:border-zinc-700/80"
            aria-label={`Collection for ${entry.name}`}
          >
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="pf-history-action h-8"
          onClick={() => {
            onLoad(entry);
            onClose();
          }}
          aria-label={`Load script ${entry.name}`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Load
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="pf-history-action-muted h-8"
          onClick={() => rename.startRename(entry)}
          aria-label={`Rename ${entry.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Rename
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="pf-history-action-muted h-8"
          disabled={isEditingTags || tagPending}
          onClick={() => tags.startEditTags(entry)}
          aria-label={`Edit tags for ${entry.name}`}
          aria-expanded={isEditingTags}
        >
          <Tag className="h-3.5 w-3.5" />
          Tags
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
          onClick={() => deleteEntry(entry.id)}
          aria-label={`Delete ${entry.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </li>
  );
}
