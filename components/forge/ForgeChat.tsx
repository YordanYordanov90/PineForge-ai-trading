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
import { useRouter } from 'next/navigation';
import { FlaskConical, Loader2, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import type { ResearchSummaryPayload } from '@/lib/api/validation';
import { Button } from '@/components/ui/button';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { agentMessagesToUIMessages } from '@/lib/agent/ui-messages';
import { MAX_MESSAGES_PER_CONVERSATION } from '@/lib/config/constants';
import type { SavedConversation, SavedScript } from '@/lib/types';
import { ForgeEmptyState } from '@/components/forge/ForgeEmptyState';
import { ForgeInput } from '@/components/forge/ForgeInput';
import { ForgeMessageList } from '@/components/forge/ForgeMessageList';
import { ForgeScrollToBottomFab } from '@/components/forge/ForgeScrollToBottomFab';
import { ResearchScriptBanner } from '@/components/forge/ResearchScriptBanner';

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
    type?: 'general' | 'research',
  ) => Promise<SavedConversation | null>;
  onConversationActivity: (id: number) => void;
  onUpdateScriptId?: (
    scriptId: number | null,
    scriptName?: string | null,
  ) => Promise<boolean>;
  onScrollOffset?: (offset: number) => void;
};

export function ForgeChat({
  activeConversationId,
  hydrationToken,
  seedScript,
  onCreateConversation,
  onConversationActivity,
  onUpdateScriptId,
  onScrollOffset,
}: ForgeChatProps) {
  const router = useRouter();

  useEffect(() => {
    if (activeConversationId == null) {
      setActiveConvType(null);
      setActiveScriptId(null);
      setActiveScriptName(null);
    }
  }, [activeConversationId]);

  const [hydratedMessages, setHydratedMessages] = useState<UIMessage[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [persistedCount, setPersistedCount] = useState(0);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [activeConvType, setActiveConvType] = useState<'general' | 'research' | null>(null);
  const [activeScriptId, setActiveScriptId] = useState<number | null>(null);
  const [activeScriptName, setActiveScriptName] = useState<string | null>(null);
  const [isGeneratingFromResearch, setIsGeneratingFromResearch] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const userAwayFromBottomRef = useRef(false);
  const turnAbortRef = useRef<AbortController | null>(null);

  const conversationIdRef = useRef<number | null>(activeConversationId);
  conversationIdRef.current = activeConversationId;

  const chatId =
    activeConversationId != null
      ? `forge-conv-${activeConversationId}`
      : 'forge-draft';

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
      id: chatId,
      transport,
      onFinish: () => {
        const id = conversationIdRef.current;
        if (id != null) onConversationActivity(id);
      },
      onError: (err) => {
        const raw =
          err?.message?.trim() ||
          'Forge encountered an error. Please try again.';
        const message = raw.includes('already in progress')
          ? 'Forge is still finishing another reply. Wait a moment, or press Stop on the conversation that is still running.'
          : raw;
        toast.error(message);
      },
    });

  const abortActiveTurn = useCallback(() => {
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    void stop();
  }, [stop]);

  const isStreaming = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (error) {
      abortActiveTurn();
    }
  }, [error, abortActiveTurn]);

  useEffect(() => {
    if (hydrationToken === 0) return;

    let cancelled = false;

    // Abort any in-flight POST so the server releases the forge stream lock
    // before the user can send in another thread.
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
        const ui = conversation
          ? agentMessagesToUIMessages(conversation.messages)
          : [];

        setHydratedMessages(ui);
        setMessages(ui);
        setPersistedCount(conversation?.messages.length ?? 0);
        setActiveConvType(conversation?.type ?? 'general');
        setActiveScriptId(conversation?.scriptId ?? null);
        setActiveScriptName(null);
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

  useEffect(() => () => abortActiveTurn(), [abortActiveTurn]);

  const localMessageCount = Math.max(
    persistedCount,
    persistedCount + Math.max(0, messages.length - hydratedMessages.length),
  );
  const reachedCap = localMessageCount >= MAX_MESSAGES_PER_CONVERSATION;

  const isResearchConv = activeConvType === 'research';
  const canGenerateFromResearch =
    isResearchConv &&
    localMessageCount >= 2 &&
    !isStreaming &&
    !hydrating &&
    !hydrationError;

  const showResearchScriptBanner =
    isResearchConv && !hydrating && !hydrationError;

  const attachedScript = useMemo(
    () =>
      activeScriptId != null
        ? { id: activeScriptId, name: activeScriptName }
        : null,
    [activeScriptId, activeScriptName],
  );

  const handleUpdateScript = useCallback(
    async (scriptId: number | null, scriptName?: string | null) => {
      if (!onUpdateScriptId) return false;
      const ok = await onUpdateScriptId(scriptId, scriptName);
      if (ok) {
        setActiveScriptId(scriptId);
        setActiveScriptName(scriptId == null ? null : (scriptName ?? null));
      }
      return ok;
    },
    [onUpdateScriptId],
  );

  // Resolve script title after hydration when only scriptId is known.
  useEffect(() => {
    if (activeScriptId == null) return;
    if (activeScriptName != null) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/scripts');
        const json: unknown = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;

        const list =
          (json as { data?: { scripts?: SavedScript[] } })?.data?.scripts ?? [];
        const match = list.find(
          (s) => Number.parseInt(s.id, 10) === activeScriptId,
        );
        if (match && !cancelled) {
          setActiveScriptName(match.name ?? null);
        }
      } catch {
        /* banner falls back to "Untitled strategy" */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeScriptId, activeScriptName]);

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

  const handleGenerateFromResearch = useCallback(async () => {
    if (!activeConversationId) return;
    setIsGeneratingFromResearch(true);
    try {
      const res = await fetch('/api/forge/research-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversationId }),
      });
      const json: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(
          messageFromApiErrorJson(
            json,
            'Could not generate research summary.',
            'Research handoff failed. Please try again.',
          ),
        );
        return;
      }

      const summary = (json as { data?: { summary?: ResearchSummaryPayload } })?.data
        ?.summary;
      if (!summary || typeof summary.description !== 'string') {
        toast.error('Received an invalid research summary from Forge.');
        return;
      }

      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(
          'pineforge_research_handoff',
          JSON.stringify(summary),
        );
      }

      router.push('/generate');
    } catch {
      toast.error('Network error — could not reach Forge summariser.');
    } finally {
      setIsGeneratingFromResearch(false);
    }
  }, [activeConversationId, router]);

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
              <>
                {showResearchScriptBanner ? (
                  <ResearchScriptBanner
                    variant="empty"
                    attachedScript={attachedScript}
                    onUpdateScript={handleUpdateScript}
                  />
                ) : null}
                <ForgeEmptyState
                  disabled={isStreaming}
                  onSuggest={(prompt) => void handleSubmit(prompt)}
                />
              </>
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
          {showResearchScriptBanner && messages.length > 0 ? (
            <ResearchScriptBanner
              variant="active"
              attachedScript={attachedScript}
              onUpdateScript={handleUpdateScript}
            />
          ) : null}
          {canGenerateFromResearch ? (
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                onClick={() => void handleGenerateFromResearch()}
                disabled={isGeneratingFromResearch}
                className="gap-2 rounded-sm border border-amber-500/40 bg-amber-500/10 font-mono text-xs uppercase tracking-widest text-amber-700 hover:bg-amber-500/15 disabled:opacity-60 dark:text-amber-400"
                variant="ghost"
              >
                <FlaskConical className="size-4" aria-hidden />
                {isGeneratingFromResearch
                  ? 'Synthesising…'
                  : 'Generate from Research'}
              </Button>
            </div>
          ) : null}

          <ForgeInput
            onSubmit={(text) => void handleSubmit(text)}
            onStop={abortActiveTurn}
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
