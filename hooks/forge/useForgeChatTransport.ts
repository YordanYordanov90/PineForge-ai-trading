'use client';

import { useMemo, useRef } from 'react';
import { DefaultChatTransport } from 'ai';
import { extractText } from '@/lib/forge/chat-message-utils';

export function useForgeChatTransport(activeConversationId: number | null) {
  const conversationIdRef = useRef<number | null>(activeConversationId);
  conversationIdRef.current = activeConversationId;

  const turnAbortRef = useRef<AbortController | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/forge',
        fetch: async (input, init) => {
          turnAbortRef.current?.abort();
          const controller = new AbortController();
          turnAbortRef.current = controller;

          const upstream = init?.signal;
          if (upstream) {
            if (upstream.aborted) {
              controller.abort(upstream.reason);
            } else {
              upstream.addEventListener(
                'abort',
                () => controller.abort(upstream.reason),
                { once: true },
              );
            }
          }

          try {
            return await fetch(input, { ...init, signal: controller.signal });
          } finally {
            if (turnAbortRef.current === controller) {
              turnAbortRef.current = null;
            }
          }
        },
        prepareSendMessagesRequest: ({ messages }) => {
          const conversationId = conversationIdRef.current;
          const latest = messages.at(-1);
          return {
            body: {
              conversationId,
              message: extractText(latest),
            },
          };
        },
      }),
    [],
  );

  return { transport, conversationIdRef, turnAbortRef };
}