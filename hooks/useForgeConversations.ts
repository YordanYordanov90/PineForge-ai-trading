'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { readConversationPayload } from '@/lib/forge/chat-message-utils';
import type { SavedConversation } from '@/lib/types';

/**
 * Forge Agent conversation sidebar state (spec 57).
 *
 * Owns the list of `SavedConversation` summaries (no `messages` array)
 * rendered by `ForgeConversationSidebar`. CRUD operations go through
 * the spec-54 REST routes and apply optimistic updates so the sidebar
 * stays responsive — failures roll back to the prior list and surface
 * a toast with the API error.
 *
 * `messages` is intentionally absent here. Conversation bodies are
 * loaded by `ForgeChat` via `GET /api/forge/conversations/[id]` only
 * when a thread is selected — this keeps the initial RSC payload
 * small and avoids re-fetching the entire history on every CRUD op.
 */

type ConversationsState = {
  conversations: SavedConversation[];
  isCreating: boolean;
  /**
   * Optimistic create returns `null` on failure so the caller can
   * skip the auto-select step. On success the freshly-persisted row
   * (with real id + timestamps) is returned.
   */
  createConversation: (
    scriptId: number | null,
    type?: 'general' | 'research',
  ) => Promise<SavedConversation | null>;
  renameConversation: (id: number, title: string) => Promise<boolean>;
  deleteConversation: (id: number) => Promise<boolean>;
  /** Update (attach/change/detach) the scriptId on a research conversation (spec 61.2). */
  updateScriptId: (id: number, scriptId: number | null) => Promise<boolean>;
  /** Bump `updatedAt` and (optionally) `title` after the chat persists a turn. */
  touchConversation: (id: number, patch?: { title?: string | null }) => void;
};

type OptimisticMutationMessages = {
  apiErrorFallback: string;
  apiErrorDefault: string;
  networkErrorMessage: string;
};

async function withOptimisticMutation(
  applyOptimistic: () => void,
  rollback: () => void,
  mutate: () => Promise<Response>,
  messages: OptimisticMutationMessages,
  onSuccess?: (json: unknown) => void,
): Promise<boolean> {
  applyOptimistic();

  try {
    const res = await mutate();
    const json: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      rollback();
      toast.error(
        messageFromApiErrorJson(
          json,
          messages.apiErrorFallback,
          messages.apiErrorDefault,
        ),
      );
      return false;
    }

    onSuccess?.(json);
    return true;
  } catch {
    rollback();
    toast.error(messages.networkErrorMessage);
    return false;
  }
}

export function useForgeConversations(
  initial: SavedConversation[],
): ConversationsState {
  const [conversations, setConversations] =
    useState<SavedConversation[]>(initial);
  const [isCreating, setIsCreating] = useState(false);

  const createConversation = useCallback(
    async (
      scriptId: number | null,
      type: 'general' | 'research' = 'general',
    ): Promise<SavedConversation | null> => {
      setIsCreating(true);
      try {
        const res = await fetch('/api/forge/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptId, type }),
        });
        const json: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(
            messageFromApiErrorJson(
              json,
              'Could not create conversation.',
              'Could not start a new Forge conversation.',
            ),
          );
          return null;
        }

        const created = readConversationPayload(json);
        if (!created) {
          toast.error('Could not start a new Forge conversation.');
          return null;
        }

        setConversations((prev) => [created, ...prev]);
        return created;
      } catch {
        toast.error('Network error — could not create a conversation.');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  const renameConversation = useCallback(
    async (id: number, title: string): Promise<boolean> => {
      const trimmed = title.trim();
      if (!trimmed) return false;

      const prev = conversations;
      return withOptimisticMutation(
        () => {
          setConversations((curr) =>
            curr.map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
          );
        },
        () => setConversations(prev),
        () =>
          fetch(`/api/forge/conversations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: trimmed }),
          }),
        {
          apiErrorFallback: 'Could not rename conversation.',
          apiErrorDefault: 'Could not rename this conversation.',
          networkErrorMessage: 'Network error — rename failed.',
        },
        (json) => {
          const updated = readConversationPayload(json);
          if (updated) {
            setConversations((curr) =>
              curr.map((c) => (c.id === id ? { ...c, ...updated } : c)),
            );
          }
        },
      );
    },
    [conversations],
  );

  const deleteConversation = useCallback(
    async (id: number): Promise<boolean> => {
      const prev = conversations;
      return withOptimisticMutation(
        () => {
          setConversations((curr) => curr.filter((c) => c.id !== id));
        },
        () => setConversations(prev),
        () =>
          fetch(`/api/forge/conversations/${id}`, {
            method: 'DELETE',
          }),
        {
          apiErrorFallback: 'Could not delete conversation.',
          apiErrorDefault: 'Could not delete this conversation.',
          networkErrorMessage: 'Network error — delete failed.',
        },
      );
    },
    [conversations],
  );

  const updateScriptId = useCallback(
    async (id: number, scriptId: number | null): Promise<boolean> => {
      const prev = conversations;
      return withOptimisticMutation(
        () => {
          setConversations((curr) =>
            curr.map((c) => (c.id === id ? { ...c, scriptId } : c)),
          );
        },
        () => setConversations(prev),
        () =>
          fetch(`/api/forge/conversations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptId }),
          }),
        {
          apiErrorFallback: 'Could not update attached script.',
          apiErrorDefault: 'Could not attach or detach the script.',
          networkErrorMessage: 'Network error — script update failed.',
        },
        (json) => {
          const updated = readConversationPayload(json);
          if (updated) {
            setConversations((curr) =>
              curr.map((c) => (c.id === id ? { ...c, ...updated } : c)),
            );
          }
        },
      );
    },
    [conversations],
  );

  const touchConversation = useCallback(
    (id: number, patch?: { title?: string | null }) => {
      const now = new Date().toISOString();
      setConversations((curr) => {
        const next = curr.map((c) =>
          c.id === id
            ? {
                ...c,
                title: patch?.title !== undefined ? patch.title : c.title,
                updatedAt: now,
              }
            : c,
        );
        next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        return next;
      });
    },
    [],
  );

  return {
    conversations,
    isCreating,
    createConversation,
    renameConversation,
    deleteConversation,
    updateScriptId,
    touchConversation,
  };
}