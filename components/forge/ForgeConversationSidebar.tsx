'use client';

import { useCallback, useMemo, useState } from 'react';
import { FlaskConical, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationActions } from '@/components/forge/ConversationActions';
import { ConversationButton } from '@/components/forge/ConversationButton';
import { ConversationRenameRow } from '@/components/forge/ConversationRenameRow';
import { DeleteConversationDialog } from '@/components/forge/DeleteConversationDialog';
import { groupConversationsByTime } from '@/lib/forge/conversation-groups';
import { formatRelativeTime } from '@/lib/forge/format-relative-time';
import { cn } from '@/lib/utils';
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
  onCreateResearchConversation?: () => void;
  onRenameConversation: (id: number, title: string) => Promise<boolean>;
  onDeleteConversation: (id: number) => Promise<boolean>;
};

export function ForgeConversationSidebar({
  conversations,
  activeConversationId,
  isCreating,
  onSelectConversation,
  onCreateConversation,
  onCreateResearchConversation,
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
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            onClick={onCreateConversation}
            disabled={isCreating}
            className="w-full justify-start gap-2 rounded-sm bg-neon-500/90 font-mono text-xs uppercase tracking-wider text-zinc-950 hover:bg-neon-400 disabled:opacity-50"
          >
            <MessageSquarePlus className="size-4" aria-hidden />
            {isCreating ? 'Starting…' : 'New chat'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCreateResearchConversation?.()}
            disabled={isCreating || !onCreateResearchConversation}
            className="w-full justify-start gap-2 rounded-sm border-amber-500/40 bg-amber-500/5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
          >
            <FlaskConical className="size-4" aria-hidden />
            {isCreating ? 'Starting…' : 'New Research'}
          </Button>
        </div>

        {conversations.length === 0 ? (
          <p className="pf-muted px-2 py-6 text-center font-mono text-xs leading-relaxed">
            {'// no sessions yet'}
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
                              type={c.type}
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

      <DeleteConversationDialog
        conversation={pendingDelete}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </>
  );
}