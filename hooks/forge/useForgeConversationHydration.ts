'use client';

import { useEffect, useState } from 'react';
import type { UIMessage } from 'ai';
import { agentMessagesToUIMessages } from '@/lib/agent/ui-messages';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { readConversationPayload } from '@/lib/forge/chat-message-utils';

type UseForgeConversationHydrationOptions = {
  hydrationToken: number;
  conversationIdRef: React.MutableRefObject<number | null>;
  abortActiveTurn: () => void;
  setMessages: (messages: UIMessage[]) => void;
};

export function useForgeConversationHydration({
  hydrationToken,
  conversationIdRef,
  abortActiveTurn,
  setMessages,
}: UseForgeConversationHydrationOptions) {
  const [hydratedMessages, setHydratedMessages] = useState<UIMessage[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [persistedCount, setPersistedCount] = useState(0);
  const [activeConvType, setActiveConvType] = useState<'general' | 'research' | null>(null);
  const [activeScriptId, setActiveScriptId] = useState<number | null>(null);
  const [activeScriptName, setActiveScriptName] = useState<string | null>(null);
  const [dismissedTipIds, setDismissedTipIds] = useState<string[]>([]);

  useEffect(() => {
    if (hydrationToken === 0) return;

    let cancelled = false;
    abortActiveTurn();

    const targetId = conversationIdRef.current;
    if (targetId == null) {
      setHydratedMessages([]);
      setMessages([]);
      setPersistedCount(0);
      setHydrationError(null);
      setActiveConvType(null);
      setActiveScriptId(null);
      setActiveScriptName(null);
      setDismissedTipIds([]);
      return () => {
        cancelled = true;
      };
    }

    setHydrating(true);
    setHydrationError(null);

    void (async () => {
      try {
        const res = await fetch(`/api/forge/conversations/${targetId}`);
        const json: unknown = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok) {
          setHydrationError(
            messageFromApiErrorJson(
              json,
              'Could not load conversation.',
              'Could not load this Forge conversation.',
            ),
          );
          setHydratedMessages([]);
          setMessages([]);
          setPersistedCount(0);
          setActiveConvType(null);
          setActiveScriptId(null);
          setActiveScriptName(null);
          return;
        }

        const conversation = readConversationPayload(json);
        const ui = conversation ? agentMessagesToUIMessages(conversation.messages) : [];

        setHydratedMessages(ui);
        setMessages(ui);
        setPersistedCount(conversation?.messages.length ?? 0);
        setActiveConvType(conversation?.type ?? 'general');
        setActiveScriptId(conversation?.scriptId ?? null);
        setActiveScriptName(null);
        setDismissedTipIds([]);
      } catch {
        if (!cancelled) {
          setHydrationError('Network error — could not load conversation.');
          setHydratedMessages([]);
          setMessages([]);
          setPersistedCount(0);
          setActiveConvType(null);
          setActiveScriptId(null);
          setActiveScriptName(null);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationToken, abortActiveTurn]);

  return {
    hydratedMessages,
    hydrating,
    hydrationError,
    persistedCount,
    activeConvType,
    setActiveConvType,
    activeScriptId,
    activeScriptName,
    setActiveScriptId,
    setActiveScriptName,
    dismissedTipIds,
    setDismissedTipIds,
  };
}