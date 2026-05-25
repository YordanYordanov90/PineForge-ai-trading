'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  Check,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { groupConversationsByTime } from '@/lib/forge/conversation-groups';
import type { SavedConversation } from '@/lib/types';

/**
 * Sidebar of saved Forge conversations (spec 57 § ConversationSidebar).
 *
 *  - Pinned "New Chat" entry at the top.
 *  - Each item shows title (or "New conversation" placeholder) and a
 *    relative timestamp.
 *  - Hover/keyboard menu exposes rename + delete; rename uses inline
 *    editing (no separate dialog) so it matches the script history
 *    rename UX. Delete opens a confirmation dialog.
 *  - All mutations are owned by the parent via the
 *    `useForgeConversations` hook — this component is purely
 *    presentational + state-coordinating.
 */

type ForgeConversationSidebarProps = {
  conversations: SavedConversation[];
  activeConversationId: number | null;
  isCreating: boolean;
  onSelectConversation: (id: number) => void;
  onCreateConversation: () => void;
  onRenameConversation: (id: number, title: string) => Promise<boolean>;
  onDeleteConversation: (id: number) => Promise<boolean>;
};

export function ForgeConversationSidebar({
  conversations,
  activeConversationId,
  isCreating,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
}: ForgeConversationSidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SavedConversation | null>(
    null,
  );
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const groupedConversations = useMemo(
    () => groupConversationsByTime(conversations),
    [conversations],
  );

  const startEditing = useCallback((c: SavedConversation) => {
    setEditingId(c.id);
    setEditingValue(c.title ?? '');
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const commitRename = useCallback(async () => {
    if (editingId == null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    setIsSavingRename(true);
    const ok = await onRenameConversation(editingId, trimmed);
    setIsSavingRename(false);
    if (ok) cancelEditing();
  }, [editingId, editingValue, onRenameConversation, cancelEditing]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    const ok = await onDeleteConversation(pendingDelete.id);
    setIsDeleting(false);
    if (ok) setPendingDelete(null);
  }, [pendingDelete, onDeleteConversation]);

  return (
    <>
      <div className="flex h-full flex-col gap-3">
        <p className="px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-neon-600/80 dark:text-neon-400/70">
          ~/conversations
        </p>
        <Button
          type="button"
          onClick={onCreateConversation}
          disabled={isCreating}
          className="w-full justify-start gap-2 rounded-sm bg-neon-500/90 font-mono text-xs uppercase tracking-wider text-zinc-950 hover:bg-neon-400 disabled:opacity-50"
        >
          <MessageSquarePlus className="size-4" aria-hidden />
          {isCreating ? 'Starting…' : 'New chat'}
        </Button>

        {conversations.length === 0 ? (
          <p className="pf-muted px-2 py-6 text-center font-mono text-xs leading-relaxed">
            // no sessions yet
          </p>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {groupedConversations.map((group) => (
              <section key={group.label}>
                <h3 className="pf-muted mb-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.25em]">
                  {group.label}
                </h3>
                <ul role="list" className="flex flex-col gap-0.5">
                  {group.conversations.map((c) => {
                    const isActive = c.id === activeConversationId;
                    const isEditing = editingId === c.id;
                    const title = c.title?.trim() || 'New conversation';

                    return (
                      <li key={c.id}>
                        <div
                          className={cn(
                            'group/forge-conversation relative rounded-sm border border-transparent py-2 pl-3 pr-2 transition-[border-color,background-color,box-shadow] duration-200',
                            isActive
                              ? 'border-l-2 border-l-neon-500 bg-neon-500/[0.08] shadow-[inset_4px_0_12px_-4px_oklch(0.7_0.17_160/0.35)] dark:bg-neon-500/[0.12]'
                              : 'border-l-2 border-l-transparent hover:border-l-zinc-300 hover:bg-zinc-100/70 dark:hover:border-l-zinc-700 dark:hover:bg-zinc-900/60',
                          )}
                        >
                          {isEditing ? (
                            <ConversationRenameRow
                              value={editingValue}
                              onChange={setEditingValue}
                              onSubmit={commitRename}
                              onCancel={cancelEditing}
                              busy={isSavingRename}
                            />
                          ) : (
                            <ConversationButton
                              title={title}
                              relative={formatRelativeTime(c.updatedAt)}
                              isActive={isActive}
                              onClick={() => onSelectConversation(c.id)}
                            />
                          )}

                          {!isEditing ? (
                            <ConversationActions
                              onRename={() => startEditing(c)}
                              onDelete={() => setPendingDelete(c)}
                            />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              This permanently removes &ldquo;{pendingDelete?.title?.trim() || 'New conversation'}&rdquo; and all of its messages. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ConversationButtonProps = {
  title: string;
  relative: string;
  isActive: boolean;
  onClick: () => void;
};

function ConversationButton({
  title,
  relative,
  isActive,
  onClick,
}: ConversationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      className="flex w-full min-w-0 flex-col items-start gap-0.5 pr-8 text-left"
    >
      <span className="flex w-full min-w-0 items-center gap-1.5">
        <span
          className="shrink-0 font-mono text-neon-600/70 dark:text-neon-400/60"
          aria-hidden
        >
          ├─
        </span>
        <span
          className={cn(
            'block min-w-0 flex-1 truncate text-sm font-medium',
            isActive
              ? 'text-neon-700 dark:text-neon-300'
              : 'text-zinc-800 dark:text-zinc-200',
          )}
        >
          {title}
        </span>
      </span>
      <span className="pf-muted block pl-5 font-mono text-[10px] tabular-nums uppercase tracking-wide">
        {relative}
      </span>
    </button>
  );
}

type ConversationRenameRowProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  busy: boolean;
};

function ConversationRenameRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  busy,
}: ConversationRenameRowProps) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void onSubmit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={200}
        disabled={busy}
        aria-label="Rename conversation"
        className="pf-input h-7 px-2 text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => void onSubmit()}
        disabled={busy}
        aria-label="Save rename"
      >
        <Check className="size-3" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onCancel}
        disabled={busy}
        aria-label="Cancel rename"
      >
        <X className="size-3" aria-hidden />
      </Button>
    </div>
  );
}

type ConversationActionsProps = {
  onRename: () => void;
  onDelete: () => void;
};

function ConversationActions({ onRename, onDelete }: ConversationActionsProps) {
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

function formatRelativeTime(iso: string): string {
  const parsed = new Date(iso).getTime();
  if (!Number.isFinite(parsed)) return '';
  const diffMs = Date.now() - parsed;
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(parsed).toLocaleDateString();
}
