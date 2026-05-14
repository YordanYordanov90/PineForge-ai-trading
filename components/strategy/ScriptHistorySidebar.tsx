'use client';

import { useState } from 'react';
import { Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScriptHistory } from '@/hooks/useScriptHistory';
import type { SavedScript } from '@/lib/types';

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

export function ScriptHistorySidebar({ onLoad }: { onLoad: (entry: SavedScript) => void }) {
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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/70 bg-zinc-950/35 backdrop-blur">
      <div className="border-b border-zinc-800/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Script History</h2>
        <p className="mt-1 text-xs text-zinc-400">Saved on this device.</p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-zinc-500">
            No saved scripts yet. Generate your first one.
          </p>
        ) : (
          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="group rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3 transition-colors hover:bg-zinc-900/50"
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
                        className="h-7 border-zinc-700 bg-zinc-950 text-xs text-white focus-visible:ring-emerald-400/30"
                        autoFocus
                        aria-label="Script name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRename(entry)}
                        className="w-full truncate text-left text-sm font-medium text-zinc-200 hover:text-emerald-300"
                      >
                        {entry.name}
                      </button>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                      <time dateTime={entry.createdAt}>{formatSavedAt(entry.createdAt)}</time>
                      <span className="rounded border border-zinc-800 px-1 font-mono text-[9px] text-zinc-400">
                        v{entry.version}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {previewPrompt(entry.prompt, 50)}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 border border-zinc-800 px-2 text-[10px] text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                    onClick={() => onLoad(entry)}
                  >
                    <FolderOpen className="mr-1 h-3 w-3" />
                    Load
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 border border-rose-500/20 px-2 text-[10px] text-rose-300 hover:bg-rose-500/10"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
