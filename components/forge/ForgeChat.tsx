'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { Loader2, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { agentMessagesToUIMessages } from '@/lib/agent/ui-messages';
import { MAX_MESSAGES_PER_CONVERSATION } from '@/lib/config/constants';
import type { SavedConversation, SavedScript } from '@/lib/types';
import { ForgeEmptyState } from '@/components/forge/ForgeEmptyState';
import { ForgeInput } from '@/components/forge/ForgeInput';
import { ForgeMessageList } from '@/components/forge/ForgeMessageList';
import { ForgeScrollToBottomFab } from '@/components/forge/ForgeScrollToBottomFab';

/**
 * Forge chat panel (spec 57 § ForgeChat).
 *
 * Owns the active conversation and wires the AI SDK's `useChat` to
 * the `POST /api/forge` streaming endpoint via a custom
 * `DefaultChatTransport` that swaps the SDK's default `{ messages }`
 * body shape for the spec-55 `{ conversationId, message }` payload.
 */

type ForgeChatProps = {
  activeConversationId: number | null;
  hydrationToken: number;
  seedScript: SavedScript | null;
  onCreateConversation: (
    scriptId: number | null,
  ) => Promise<SavedConversation | null>;
  onConversationActivity: (id: number) => void;
  onScrollOffset?: (offset: number) => void;
};

export function ForgeChat({
  activeConversationId,
  hydrationToken,
  seedScript,
  onCreateConversation,
  onConversationActivity,
  onScrollOffset,
}: ForgeChatProps) {
  const [hydratedMessages, setHydratedMessages] = useState<UIMessage[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [persistedCount, setPersistedCount] = useState(0);
  const [showScrollFab, setShowScrollFab] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const userAwayFromBottomRef = useRef(false);

  const conversationIdRef = useRef<number | null>(activeConversationId);
  conversationIdRef.current = activeConversationId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/forge',
        prepareSendMessagesRequest: ({ messages }) => {
          const conversationId = conversationIdRef.current;
          const latest = messages.at(-1);
          const text = extractText(latest);
          return {
            body: {
              conversationId,
              message: text,
            },
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages, error } =
    useChat({
      transport,
      onFinish: () => {
        const id = conversationIdRef.current;
        if (id != null) onConversationActivity(id);
      },
      onError: (err) => {
        const message =
          err?.message?.trim() ||
          'Forge encountered an error. Please try again.';
        toast.error(message);
      },
    });

  const isStreaming = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (error) {
      void stop();
    }
  }, [error, stop]);

  useEffect(() => {
    if (hydrationToken === 0) return;

    let cancelled = false;

    void stop();

    const targetId = conversationIdRef.current;
    if (targetId == null) {
      setHydratedMessages([]);
      setMessages([]);
      setPersistedCount(0);
      setHydrationError(null);
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
          return;
        }

        const conversation = readConversationPayload(json);
        const ui = conversation
          ? agentMessagesToUIMessages(conversation.messages)
          : [];

        setHydratedMessages(ui);
        setMessages(ui);
        setPersistedCount(conversation?.messages.length ?? 0);
      } catch {
        if (!cancelled) {
          setHydrationError('Network error — could not load conversation.');
          setHydratedMessages([]);
          setMessages([]);
          setPersistedCount(0);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationToken]);

  useEffect(() => () => void stop(), [stop]);

  const localMessageCount = Math.max(
    persistedCount,
    persistedCount + Math.max(0, messages.length - hydratedMessages.length),
  );
  const reachedCap = localMessageCount >= MAX_MESSAGES_PER_CONVERSATION;

  const seedScriptDbId = useMemo(
    () => parseSavedScriptId(seedScript?.id),
    [seedScript?.id],
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      if (conversationIdRef.current == null) {
        const created = await onCreateConversation(seedScriptDbId);
        if (!created) return;
        conversationIdRef.current = created.id;
      }
      await sendMessage({ text });
    },
    [onCreateConversation, seedScriptDbId, sendMessage],
  );

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const away = distanceFromBottom > 120;
    userAwayFromBottomRef.current = away;
    setShowScrollFab(away);
    onScrollOffset?.(el.scrollTop);
  }, [onScrollOffset]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    userAwayFromBottomRef.current = false;
    setShowScrollFab(false);
  }, []);

  const showMessageList =
    activeConversationId != null &&
    !hydrating &&
    !hydrationError &&
    messages.length > 0;

  const inputDisabled =
    (activeConversationId != null || seedScript != null) &&
    (hydrating || Boolean(hydrationError));

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {seedScript != null && activeConversationId == null ? (
        <div className="shrink-0 px-4 pt-3 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <SeedScriptBanner script={seedScript} />
          </div>
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth"
      >
        {activeConversationId == null && !seedScript ? (
          <ForgeEmptyState
            disabled={isStreaming}
            onSuggest={(prompt) => void handleSubmit(prompt)}
          />
        ) : (
          <>
            {hydrating ? (
              <div className="pf-muted flex items-center justify-center gap-2 py-12 text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading conversation…
              </div>
            ) : hydrationError ? (
              <div className="mx-auto mt-12 max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
                {hydrationError}
              </div>
            ) : messages.length === 0 ? (
              <ForgeEmptyState
                disabled={isStreaming}
                onSuggest={(prompt) => void handleSubmit(prompt)}
              />
            ) : (
              <ForgeMessageList
                messages={messages}
                isStreaming={isStreaming}
                bottomRef={bottomRef}
                userAwayFromBottomRef={userAwayFromBottomRef}
              />
            )}
          </>
        )}
        {!showMessageList ? <div ref={bottomRef} aria-hidden /> : null}
      </div>

      <ForgeScrollToBottomFab visible={showScrollFab} onClick={scrollToBottom} />

      <div className="border-t border-neon-500/15 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-neon-500/10 dark:bg-zinc-950/80">
        <div className="mx-auto w-full max-w-3xl">
          <ForgeInput
            onSubmit={(text) => void handleSubmit(text)}
            onStop={() => void stop()}
            isStreaming={isStreaming}
            disabled={inputDisabled}
            reachedMessageCap={reachedCap}
          />
        </div>
      </div>
    </div>
  );
}

function SeedScriptBanner({ script }: { script: SavedScript }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-start gap-3 rounded-sm border border-neon-500/30 border-l-2 border-l-neon-500 bg-neon-500/[0.08] p-3 shadow-lg shadow-black/10 backdrop-blur-md dark:bg-neon-500/[0.12] dark:shadow-black/40">
        <div className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-neon-500/30 bg-neon-500/10 text-neon-500 dark:text-neon-400">
          <ScrollText className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neon-700 dark:text-neon-200">
            Forge has loaded your script: {script.name || 'Untitled strategy'}
          </p>
          <p className="pf-muted mt-0.5 text-xs leading-relaxed">
            Ask anything about it — Forge can run a Health Score, refine the script, or generate alerts.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/forge">Dismiss</Link>
        </Button>
      </div>
    </div>
  );
}

function extractText(message: UIMessage | undefined): string {
  if (!message) return '';
  let text = '';
  for (const part of message.parts) {
    if (part.type === 'text') {
      text += (part as { text: string }).text;
    }
  }
  return text;
}

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

function parseSavedScriptId(id: string | undefined): number | null {
  if (!id) return null;
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}
