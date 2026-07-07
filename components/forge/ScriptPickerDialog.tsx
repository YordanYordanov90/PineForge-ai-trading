'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useScripts } from '@/hooks/useScripts';
import type { SavedScript } from '@/lib/types';

type ScriptPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (script: SavedScript) => Promise<boolean>;
  scripts?: SavedScript[];
};

export function ScriptPickerDialog({
  open,
  onOpenChange,
  onSelect,
  scripts: scriptsProp,
}: ScriptPickerDialogProps) {
  const hasPrefetchedScripts = Boolean(scriptsProp && scriptsProp.length > 0);
  const { scripts: fetchedScripts, loading } = useScripts({
    enabled: open && !hasPrefetchedScripts,
  });
  const scripts = useMemo(
    () => (hasPrefetchedScripts ? (scriptsProp ?? []) : fetchedScripts),
    [hasPrefetchedScripts, scriptsProp, fetchedScripts],
  );
  const [query, setQuery] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery('');
    }
    onOpenChange(next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts.slice(0, 20);
    return scripts
      .filter((s) => (s.name || 'Untitled strategy').toLowerCase().includes(q))
      .slice(0, 20);
  }, [scripts, query]);

  const handleSelect = async (script: SavedScript) => {
    const numericId = Number.parseInt(script.id, 10);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      toast.error('Invalid script selected.');
      return;
    }
    const ok = await onSelect(script);
    if (ok) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Load script from history</DialogTitle>
          <DialogDescription className="pf-muted">
            Attach a saved script to this research thread. The next message will include it as context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Input
            placeholder="Filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9"
            autoFocus
          />

          <div className="max-h-[320px] overflow-y-auto rounded-sm border border-zinc-800/70">
            {loading ? (
              <div className="p-4 text-center text-sm text-zinc-400">Loading scripts…</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-400">
                No matching scripts.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800/70">
                {filtered.map((script) => {
                  const name = script.name || 'Untitled strategy';
                  const date = script.createdAt
                    ? new Date(script.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '';
                  return (
                    <li key={script.id}>
                      <button
                        type="button"
                        onClick={() => void handleSelect(script)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-amber-500/5 focus:bg-amber-500/5 focus:outline-none"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 truncate font-medium text-sm">
                            {name}
                            {script.isStarred ? (
                              <Star className="size-3.5 text-amber-400" aria-hidden />
                            ) : null}
                          </div>
                          {date && (
                            <div className="pf-muted text-[10px] tabular-nums">{date}</div>
                          )}
                        </div>
                        <div className="shrink-0 text-[10px] uppercase tracking-widest text-amber-600/70">
                          Attach
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {scripts.length > 20 && (
            <p className="pf-muted text-center text-[10px]">
              Showing first 20. Search in{' '}
              <Link href="/generate" className="underline">
                /generate
              </Link>{' '}
              history for more.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}