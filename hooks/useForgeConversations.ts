'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
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
      setConversations((curr) =>
        curr.map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
      );

      try {
        const res = await fetch(`/api/forge/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmed }),
        });
        const json: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          setConversations(prev);
          toast.error(
            messageFromApiErrorJson(
              json,
              'Could not rename conversation.',
              'Could not rename this conversation.',
            ),
          );
          return false;
        }

        const updated = readConversationPayload(json);
        if (updated) {
          setConversations((curr) =>
            curr.map((c) => (c.id === id ? { ...c, ...updated } : c)),
          );
        }
        return true;
      } catch {
        setConversations(prev);
        toast.error('Network error — rename failed.');
        return false;
      }
    },
    [conversations],
  );

  const deleteConversation = useCallback(
    async (id: number): Promise<boolean> => {
      const prev = conversations;
      setConversations((curr) => curr.filter((c) => c.id !== id));

      try {
        const res = await fetch(`/api/forge/conversations/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          setConversations(prev);
          const json: unknown = await res.json().catch(() => null);
          toast.error(
            messageFromApiErrorJson(
              json,
              'Could not delete conversation.',
              'Could not delete this conversation.',
            ),
          );
          return false;
        }
        return true;
      } catch {
        setConversations(prev);
        toast.error('Network error — delete failed.');
        return false;
      }
    },
    [conversations],
  );

  const updateScriptId = useCallback(
    async (id: number, scriptId: number | null): Promise<boolean> => {
      const prev = conversations;
      // Optimistic update of the scriptId on the list item (sidebar + any consumers)
      setConversations((curr) =>
        curr.map((c) => (c.id === id ? { ...c, scriptId } : c)),
      );

      try {
        const res = await fetch(`/api/forge/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptId }),
        });
        const json: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          setConversations(prev);
          toast.error(
            messageFromApiErrorJson(
              json,
              'Could not update attached script.',
              'Could not attach or detach the script.',
            ),
          );
          return false;
        }

        const updated = readConversationPayload(json);
        if (updated) {
          setConversations((curr) =>
            curr.map((c) => (c.id === id ? { ...c, ...updated } : c)),
          );
        }
        return true;
      } catch {
        setConversations(prev);
        toast.error('Network error — script update failed.');
        return false;
      }
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

/**
 * Extracts `{ conversation: SavedConversation }` out of the standard
 * `{ success, data, error }` envelope. Returns `null` for anything
 * unexpected so the caller surfaces an error instead of pretending
 * the call worked.
 */
function readConversationPayload(
  raw: unknown,
): SavedConversation | null {
  if (!raw || typeof raw !== 'object') return null;
  const envelope = raw as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== 'object') return null;
  const payload = envelope.data as { conversation?: unknown };
  const conversation = payload.conversation;
  if (!conversation || typeof conversation !== 'object') return null;
  return conversation as SavedConversation;
}
