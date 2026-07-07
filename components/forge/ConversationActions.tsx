'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConversationActionsProps = {
  onRename: () => void;
  onDelete: () => void;
};

export function ConversationActions({ onRename, onDelete }: ConversationActionsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClickAway);
    return () => window.removeEventListener('mousedown', onClickAway);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="absolute right-1.5 top-1.5 flex items-center"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Conversation actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((curr) => !curr)}
        className={cn(
          'opacity-0 transition-opacity group-hover/forge-conversation:opacity-100 focus-visible:opacity-100',
          open && 'opacity-100',
        )}
      >
        <MoreHorizontal className="size-3.5" aria-hidden />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-7 z-30 min-w-[10rem] overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRename();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Pencil className="size-3.5" aria-hidden />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}