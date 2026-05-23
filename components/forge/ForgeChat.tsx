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

/**
 * Forge chat panel (spec 57 § ForgeChat).
 *
 * Owns the active conversation and wires the AI SDK's `useChat` to
 * the `POST /api/forge` streaming endpoint via a custom
 * `DefaultChatTransport` that swaps the SDK's default `{ messages }`
 * body shape for the spec-55 `{ conversationId, message }` payload.
 *
 * State machine:
 *  - No active conversation: render `ForgeEmptyState`. Suggestion
 *    chips create a conversation on demand and seed the first
 *    message.
 *  - Active conversation: hydrate `messages` from `GET
 *    /api/forge/conversations/[id]`, then let `useChat` take over.
 *  - Streaming finished: notify the parent so the sidebar can bump
 *    `updated_at` (the server already persists the canonical thread
 *    in spec 55's `onFinish`, so we never write here).
 *
 * On unmount / conversation switch we call `stop()` so an in-flight
 * stream is aborted instead of writing to a stale conversation row.
 */

type ForgeChatProps = {
  activeConversationId: number | null;
  /**
   * Monotonically-increasing token bumped by the parent whenever the
   * user *intentionally* navigates to an existing conversation (e.g.
   * sidebar click). When this changes, the chat panel aborts any
   * in-flight stream and re-hydrates from the server. We never bump
   * this when a fresh conversation is created mid-send — the chat
   * already owns the user's pending message via `useChat` and a
   * hydration cycle would wipe it.
   */
  hydrationToken: number;
  /** Optional script context attached to a *new* conversation only. */
  seedScript: SavedScript | null;
  /**
   * Returned conversation (with empty messages) after a suggestion
   * chip or empty-state action creates one. The parent uses this to
   * push the new conversation onto the sidebar and select it.
   */
  onCreateConversation: (
    scriptId: number | null,
  ) => Promise<SavedConversation | null>;
  /** Bumps the sidebar entry's `updated_at` after a turn settles. */
  onConversationActivity: (id: number) => void;
};

export function ForgeChat({
  activeConversationId,
  hydrationToken,
  seedScript,
  onCreateConversation,
  onConversationActivity,
}: ForgeChatProps) {
  const [hydratedMessages, setHydratedMessages] = useState<UIMessage[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [persistedCount, setPersistedCount] = useState(0);

  const conversationIdRef = useRef<number | null>(activeConversationId);
  conversationIdRef.current = activeConversationId;

  // Spec 55 takes `{ conversationId, message }` rather than the AI
  // SDK's default `{ messages }` shape, so we override the request
  // body. The latest user message is the only one the server needs —
  // the rest of the thread is stored server-side. Sending less data
  // also tightens the rate-limit + prompt-injection surface.
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

  // Hydrate messages whenever the parent bumps the token. We do *not*
  // hydrate on activeConversationId changes alone because creating a
  // new conversation via the empty-state chip changes the id mid-send
  // and we'd otherwise abort the in-flight stream and wipe the
  // pending message.
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
    // `setMessages` / `stop` are stable refs from useChat — we only
    // want to re-hydrate when the parent explicitly bumps the token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationToken]);

  // Stop any in-flight stream on unmount so we don't write partial
  // results to a stale conversation row when the user navigates away.
  useEffect(() => () => void stop(), [stop]);

  // Approximate the per-conversation message cap. We start from the
  // server-persisted count and conservatively add the in-flight UI
  // messages that haven't been persisted yet (one user message → one
  // assistant message minimum).
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
        // Write the freshly-created id straight into the ref so the
        // transport's `prepareSendMessagesRequest` closure picks up
        // the right conversation on this very send — the parent's
        // `activeId` state update won't have flushed to props yet.
        conversationIdRef.current = created.id;
      }
      await sendMessage({ text });
    },
    [onCreateConversation, seedScriptDbId, sendMessage],
  );

  if (activeConversationId == null && !seedScript) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <ForgeEmptyState
            disabled={isStreaming}
            onSuggest={(prompt) => void handleSubmit(prompt)}
          />
        </div>
        <div className="border-t border-emerald-500/15 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-emerald-500/10 dark:bg-zinc-950/80">
          <div className="mx-auto w-full max-w-3xl">
            <ForgeInput
              onSubmit={(text) => void handleSubmit(text)}
              isStreaming={isStreaming}
              onStop={() => void stop()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        {seedScript && activeConversationId == null ? (
          <SeedScriptBanner script={seedScript} />
        ) : null}

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
          <ForgeMessageList messages={messages} isStreaming={isStreaming} />
        )}
      </div>

      <div className="border-t border-emerald-500/15 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 dark:border-emerald-500/10 dark:bg-zinc-950/80">
        <div className="mx-auto w-full max-w-3xl">
          <ForgeInput
            onSubmit={(text) => void handleSubmit(text)}
            onStop={() => void stop()}
            isStreaming={isStreaming}
            disabled={hydrating || Boolean(hydrationError)}
            reachedMessageCap={reachedCap}
          />
        </div>
      </div>
    </div>
  );
}

function SeedScriptBanner({ script }: { script: SavedScript }) {
  return (
    <div className="mx-auto mt-6 w-full max-w-3xl px-4 sm:px-0">
      <div className="flex items-start gap-3 rounded-sm border border-emerald-500/30 border-l-2 border-l-emerald-500 bg-emerald-500/[0.05] p-3 dark:bg-emerald-500/[0.08]">
        <div className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
          <ScrollText className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
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

/**
 * `SavedScript.id` is a string at the type layer because the localStorage-backed
 * history (Phase 1–3) used opaque ids. DB-backed rows convert their numeric id
 * to a string via `String(row.id)` (see `rowToSavedScript`). For Forge seeding
 * we need the numeric DB id back; anything non-numeric (legacy localStorage
 * row) silently falls through to `null` so we don't 403 the create call.
 */
function parseSavedScriptId(id: string | undefined): number | null {
  if (!id) return null;
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}
