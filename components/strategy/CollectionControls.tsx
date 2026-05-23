'use client';

import { useState } from 'react';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SavedCollection } from '@/lib/types';
import { cn } from '@/lib/utils';

export type CollectionFilterValue = number | 'uncategorized' | undefined;

type CollectionControlsProps = {
  collections: readonly SavedCollection[];
  activeFilter: CollectionFilterValue;
  onFilterChange: (value: CollectionFilterValue) => void;
  onCreate: (name: string) => Promise<SavedCollection | undefined>;
  onRename: (id: number, name: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  disabled?: boolean;
};

function filterChipClass(active: boolean) {
  return cn(
    'rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors',
    active
      ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:border-sky-400/40 dark:text-sky-300'
      : 'border-zinc-300 text-zinc-500 hover:border-sky-500/40 hover:text-sky-600 dark:border-zinc-700/80 dark:text-zinc-400 dark:hover:text-sky-300',
  );
}

export function CollectionControls({
  collections,
  activeFilter,
  onFilterChange,
  onCreate,
  onRename,
  onDelete,
  disabled = false,
}: CollectionControlsProps) {
  const [newName, setNewName] = useState('');
  const [createPending, setCreatePending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [rowPendingId, setRowPendingId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!newName.trim() || createPending) return;
    setCreatePending(true);
    const created = await onCreate(newName);
    setCreatePending(false);
    if (created) setNewName('');
  };

  const startRename = (c: SavedCollection) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const commitRename = async (id: number) => {
    setRowPendingId(id);
    const ok = await onRename(id, editName);
    setRowPendingId(null);
    if (ok) {
      setEditingId(null);
      setEditName('');
    }
  };

  const handleDelete = async (id: number) => {
    setRowPendingId(id);
    await onDelete(id);
    setRowPendingId(null);
    if (activeFilter === id) onFilterChange(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        <span className="w-full text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Filter by collection
        </span>
        <button
          type="button"
          disabled={disabled}
          className={filterChipClass(activeFilter === undefined)}
          aria-pressed={activeFilter === undefined}
          onClick={() => onFilterChange(undefined)}
        >
          All
        </button>
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            className={filterChipClass(activeFilter === c.id)}
            aria-pressed={activeFilter === c.id}
            onClick={() => onFilterChange(c.id)}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          className={filterChipClass(activeFilter === 'uncategorized')}
          aria-pressed={activeFilter === 'uncategorized'}
          onClick={() => onFilterChange('uncategorized')}
        >
          None
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800/70">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Collections
        </p>
        <div className="flex gap-1.5">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
            }}
            disabled={disabled || createPending}
            placeholder="New collection"
            className="pf-input h-7 flex-1 text-xs"
            aria-label="New collection name"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="pf-history-action h-7 shrink-0 px-2"
            disabled={disabled || createPending || !newName.trim()}
            onClick={() => void handleCreate()}
            aria-label="Create collection"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {collections.length === 0 ? (
          <p className="pf-muted mt-2 text-[10px]">
            No collections yet. Create one to organize scripts.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {collections.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-1 rounded-md px-1 py-0.5"
              >
                {editingId === c.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => void commitRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void commitRename(c.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditName('');
                      }
                    }}
                    disabled={rowPendingId === c.id}
                    className="pf-input h-7 flex-1 text-xs"
                    autoFocus
                    aria-label={`Rename ${c.name}`}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                    {c.name}
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="pf-history-action-muted h-7 w-7 p-0"
                  disabled={disabled || rowPendingId === c.id}
                  onClick={() => startRename(c)}
                  aria-label={`Rename collection ${c.name}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 border border-rose-500/20 p-0 text-rose-600 dark:text-rose-300"
                  disabled={disabled || rowPendingId === c.id}
                  onClick={() => void handleDelete(c.id)}
                  aria-label={`Delete collection ${c.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
