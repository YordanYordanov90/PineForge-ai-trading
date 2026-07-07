'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MAX_MESSAGES_PER_CONVERSATION } from '@/lib/config/constants';
import { parseSavedScriptId } from '@/lib/forge/chat-message-utils';
import type { SavedConversation, SavedScript } from '@/lib/types';
import { ForgeEmptyState } from '@/components/forge/ForgeEmptyState';
import { ForgeInput } from '@/components/forge/ForgeInput';
import { ForgeMessageList } from '@/components/forge/ForgeMessageList';
import { ForgeScrollToBottomFab } from '@/components/forge/ForgeScrollToBottomFab';
import { ResearchScriptBanner } from '@/components/forge/ResearchScriptBanner';
import { SeedScriptBanner } from '@/components/forge/SeedScriptBanner';
import { useForgeChatScroll } from '@/hooks/forge/useForgeChatScroll';
import { useForgeChatTransport } from '@/hooks/forge/useForgeChatTransport';
import { useForgeConversationHydration } from '@/hooks/forge/useForgeConversationHydration';
import { useForgeResearchHandoff } from '@/hooks/forge/useForgeResearchHandoff';

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
  const { transport, conversationIdRef, turnAbortRef } =
    useForgeChatTransport(activeConversationId);

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    transport,
    onFinish: () => {
      const id = conversationIdRef.current;
      if (id != null) onConversationActivity(id);
    },
    onError: (err) => {
      const raw = err?.message?.trim() || 'Forge encountered an error. Please try again.';
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
  }, [stop, turnAbortRef]);

  const {
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
  } = useForgeConversationHydration({
    hydrationToken,
    conversationIdRef,
    abortActiveTurn,
    setMessages,
  });

  useEffect(() => {
    if (activeConversationId == null) {
      setActiveConvType(null);
      setActiveScriptId(null);
      setActiveScriptName(null);
    }
  }, [activeConversationId, setActiveConvType, setActiveScriptId, setActiveScriptName]);

  useEffect(() => {
    if (error) abortActiveTurn();
  }, [error, abortActiveTurn]);

  useEffect(() => () => abortActiveTurn(), [abortActiveTurn]);

  const {
    scrollContainerRef,
    bottomRef,
    userAwayFromBottomRef,
    showScrollFab,
    handleScroll,
    scrollToBottom,
  } = useForgeChatScroll(onScrollOffset);
  const research = useForgeResearchHandoff(activeConversationId);

  const localMessageCount = Math.max(
    persistedCount,
    persistedCount + Math.max(0, messages.length - hydratedMessages.length),
  );
  const reachedCap = localMessageCount >= MAX_MESSAGES_PER_CONVERSATION;
  const isStreaming = status === 'submitted' || status === 'streaming';
  const isResearchConv = activeConvType === 'research';
  const canGenerateFromResearch =
    isResearchConv &&
    localMessageCount >= 2 &&
    !isStreaming &&
    !hydrating &&
    !hydrationError;

  const showResearchScriptBanner = isResearchConv && !hydrating && !hydrationError;

  const attachedScript = useMemo(
    () =>
      activeScriptId != null ? { id: activeScriptId, name: activeScriptName } : null,
    [activeScriptId, activeScriptName],
  );

  const visibleMessages = useMemo(() => {
    if (dismissedTipIds.length === 0) return messages;
    return messages.filter((m) => {
      const parts = m.parts as readonly unknown[] | undefined;
      const tipPart = parts?.find(
        (p): p is { type: string; data?: { id?: string } } =>
          p != null &&
          typeof p === 'object' &&
          'type' in p &&
          (p as { type?: unknown }).type === 'data-tip',
      );
      if (tipPart?.data?.id) {
        return !dismissedTipIds.includes(tipPart.data.id);
      }
      return true;
    });
  }, [messages, dismissedTipIds]);

  const handleTipDismiss = useCallback((id: string) => {
    setDismissedTipIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, [setDismissedTipIds]);

  const handleTipRefine = useCallback(
    (suggestion?: string) => {
      if (suggestion && typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(suggestion).catch(() => {});
        toast('Refine suggestion copied. Open /generate and use the Refine Chat to apply it.');
      }
      router.push('/generate');
    },
    [router],
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
    [onUpdateScriptId, setActiveScriptId, setActiveScriptName],
  );

  useEffect(() => {
    if (activeScriptId == null || activeScriptName != null) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/scripts');
        const json: unknown = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;

        const list =
          (json as { data?: { scripts?: SavedScript[] } })?.data?.scripts ?? [];
        const match = list.find((s) => Number.parseInt(s.id, 10) === activeScriptId);
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
  }, [activeScriptId, activeScriptName, setActiveScriptName]);

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
    [onCreateConversation, seedScriptDbId, sendMessage, conversationIdRef],
  );

  const showMessageList =
    activeConversationId != null && !hydrating && !hydrationError && messages.length > 0;

  const inputDisabled =
    (activeConversationId != null || seedScript != null) &&
    (hydrating || Boolean(hydrationError));

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {seedScript != null && activeConversationId == null ? (
        <div className="shrink-0 px-4 pt-3 sm:px-6">
          <SeedScriptBanner script={seedScript} />
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
                messages={visibleMessages}
                isStreaming={isStreaming}
                bottomRef={bottomRef}
                userAwayFromBottomRef={userAwayFromBottomRef}
                onTipDismiss={handleTipDismiss}
                onTipRefine={handleTipRefine}
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
                onClick={() => void research.handleGenerateFromResearch()}
                disabled={research.isGeneratingFromResearch}
                className="gap-2 rounded-sm border border-amber-500/40 bg-amber-500/10 font-mono text-xs uppercase tracking-widest text-amber-700 hover:bg-amber-500/15 disabled:opacity-60 dark:text-amber-400"
                variant="ghost"
              >
                <FlaskConical className="size-4" aria-hidden />
                {research.isGeneratingFromResearch
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