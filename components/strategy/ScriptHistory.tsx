'use client';

import { useState } from 'react';
import { Clock, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useScriptHistory } from '@/hooks/useScriptHistory';
import type { SavedScript } from '@/lib/types';
import { cn } from '@/lib/utils';
import { terminalActivePressed } from '@/lib/ui/terminal-texture';

type ScriptHistoryProps = {
  onLoad: (entry: SavedScript) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

export function ScriptHistory({ onLoad, open, onOpenChange }: ScriptHistoryProps) {
  const { entries, renameEntry, deleteEntry } = useScriptHistory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (entry: SavedScript) => {
    setEditingId(entry.id);
    setEditName(entry.name);
  };

  const commitRename = (id: string) => {
    renameEntry(id, editName);
    setEditingId(null);
    setEditName('');
  };

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
          <SheetDescription className="pf-muted">
            Saved on this device. Up to 50 scripts, oldest removed when full.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {entries.length === 0 ? (
            <p className="pf-muted px-4 py-8 text-center text-sm sm:px-6">
              No saved scripts yet. Generate your first one.
            </p>
          ) : (
            <ul className="flex-1 overflow-y-auto px-2 py-3 sm:px-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="pf-history-entry mb-2 rounded-xl p-3 last:mb-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {editingId === entry.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => commitRename(entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(entry.id);
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditName('');
                            }
                          }}
                          className="pf-input h-8 text-sm"
                          autoFocus
                          aria-label="Script name"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRename(entry)}
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
                      </div>
                      <p className="pf-muted mt-2 line-clamp-2 text-xs leading-relaxed">
                        {previewPrompt(entry.prompt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="pf-history-action h-8"
                      onClick={() => {
                        onLoad(entry);
                        onOpenChange(false);
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
                      onClick={() => startRename(entry)}
                      aria-label={`Rename ${entry.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
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
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
