'use client';

import { useCallback } from 'react';
import { readConversationPayload } from '@/lib/forge/chat-message-utils';

type TouchConversation = (
  id: number,
  patch?: { title?: string | null },
) => void;

/**
 * Re-fetch a conversation's server-side title after chat activity so the
 * sidebar stays aligned with auto-titles from the streaming endpoint.
 */
export function useForgeConversationTitleSync(touchConversation: TouchConversation) {
  return useCallback(
    (id: number) => {
      void (async () => {
        try {
          const res = await fetch(`/api/forge/conversations/${id}`);
          const json: unknown = await res.json().catch(() => null);
          if (!res.ok) {
            touchConversation(id);
            return;
          }
          const conversation = readConversationPayload(json);
          touchConversation(id, {
            title: conversation?.title ?? null,
          });
        } catch {
          touchConversation(id);
        }
      })();
    },
    [touchConversation],
  );
}