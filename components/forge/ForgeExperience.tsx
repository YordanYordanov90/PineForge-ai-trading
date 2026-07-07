'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useForgeConversations } from '@/hooks/useForgeConversations';
import { UserPlanProvider } from '@/lib/providers/UserPlanContext';
import { cn } from '@/lib/utils';
import type { SavedConversation, SavedScript } from '@/lib/types';
import { ForgeChat } from '@/components/forge/ForgeChat';
import { ForgeConversationSidebar } from '@/components/forge/ForgeConversationSidebar';

/**
 * Top-level Forge page shell (spec 57 § Page Structure).
 *
 *  - Global app navigation lives in `AppNavbar` via `app/(app)/layout`.
 *  - Persistent conversation sidebar on ≥ lg viewports; a Sheet
 *    drawer below that (same pattern as `/generate`'s Script History).
 *  - Chat panel owns `useChat` + `messages` via `ForgeChat`.
 *  - When `/forge?scriptId=<id>` resolves to an owned script, the
 *    server-rendered `seedScript` is passed through so the chat
 *    creates a script-scoped conversation on first send.
 *  - `UserPlanProvider` mirrors the `/generate` plan plumbing so any
 *    Forge tool that wraps an AI route can still surface tier-aware
 *    affordances later without prop drilling.
 */

type ForgeExperienceProps = {
  initialPlan: string;
  initialConversations: SavedConversation[];
  seedScript: SavedScript | null;
};

export function ForgeExperience({
  initialPlan,
  initialConversations,
  seedScript,
}: ForgeExperienceProps) {
  const conversations = useForgeConversations(initialConversations);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [hydrationToken, setHydrationToken] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  const handleCreateConversation = useCallback(
    async (scriptId: number | null, type: 'general' | 'research' = 'general') => {
      const created = await conversations.createConversation(scriptId, type);
      if (created) {
        setActiveId(created.id);
        setSidebarOpen(false);
        // No `setHydrationToken` bump — this code path also runs when
        // `ForgeChat.handleSubmit` creates the conversation on the
        // first user message, and hydrating there would wipe the
        // in-flight user text. Sidebar-initiated creates use
        // `handleCreateAndOpen` below which bumps hydration explicitly.
      }
      return created;
    },
    [conversations],
  );

  const handleCreateAndOpen = useCallback(
    async (type: 'general' | 'research' = 'general') => {
      const created = await handleCreateConversation(null, type);
      if (created) {
        // Force a fresh hydrate so the chat panel clears any previous
        // conversation's messages and renders the empty state for the
        // newly opened thread without requiring a sidebar click.
        setHydrationToken((curr) => curr + 1);
      }
    },
    [handleCreateConversation],
  );

  const handleSelect = useCallback((id: number) => {
    setActiveId(id);
    setHydrationToken((curr) => curr + 1);
    setSidebarOpen(false);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      const ok = await conversations.deleteConversation(id);
      if (ok && id === activeId) {
        setActiveId(null);
        setHydrationToken((curr) => curr + 1);
      }
      return ok;
    },
    [conversations, activeId],
  );

  const handleConversationActivity = useCallback(
    (id: number) => {
      // Re-fetch the freshly-bumped title from the server because the
      // streaming endpoint auto-titles the first exchange. Doing a
      // narrow GET keeps the response small and avoids drifting from
      // the server-side canonical state.
      void (async () => {
        try {
          const res = await fetch(`/api/forge/conversations/${id}`);
          const json: unknown = await res.json().catch(() => null);
          if (!res.ok) {
            conversations.touchConversation(id);
            return;
          }
          const envelope = json as { data?: { conversation?: SavedConversation } };
          const conversation = envelope?.data?.conversation;
          conversations.touchConversation(id, {
            title: conversation?.title ?? null,
          });
        } catch {
          conversations.touchConversation(id);
        }
      })();
    },
    [conversations],
  );

  // When the user arrives via `/forge?scriptId=<id>`, focus the empty
  // state but don't auto-create yet — we wait for the first user
  // message so we don't burn a conversation slot on accidental visits.
  const showSeedBanner = activeId == null && seedScript != null;

  const handleCreateResearchConversation = useCallback(
    () => void handleCreateAndOpen('research'),
    [handleCreateAndOpen],
  );

  const handleUpdateScriptId = useCallback(
    async (scriptId: number | null) => {
      if (!activeId) return false;
      return conversations.updateScriptId(activeId, scriptId);
    },
    [conversations, activeId],
  );

  const sidebar = useMemo(
    () => (
      <ForgeConversationSidebar
        conversations={conversations.conversations}
        activeConversationId={activeId}
        isCreating={conversations.isCreating}
        onSelectConversation={handleSelect}
        onCreateConversation={() => void handleCreateAndOpen('general')}
        onCreateResearchConversation={handleCreateResearchConversation}
        onRenameConversation={conversations.renameConversation}
        onDeleteConversation={handleDelete}
      />
    ),
    [
      conversations.conversations,
      conversations.isCreating,
      conversations.renameConversation,
      activeId,
      handleSelect,
      handleCreateAndOpen,
      handleCreateResearchConversation,
      handleDelete,
    ],
  );

  const handleScrollOffset = useCallback((offset: number) => {
    setParallaxOffset(offset);
  }, []);

  const parallaxStyle = useMemo(
    () => ({
      backgroundPosition: `${parallaxOffset * 0.02}px ${parallaxOffset * 0.015}px`,
    }),
    [parallaxOffset],
  );

  // Close the mobile sidebar when the route transitions to streaming
  // — keeps the conversation in view while the response arrives.
  useEffect(() => {
    if (sidebarOpen) setSidebarOpen(false);
    // We intentionally only react to activeId — sidebarOpen is the
    // *state* we're managing, including it would cause an immediate
    // close on every open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <UserPlanProvider plan={initialPlan}>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="forge-terminal-grid forge-noise pointer-events-none absolute inset-0 opacity-60 will-change-[background-position]"
          style={parallaxStyle}
        />

        <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              'hidden w-72 shrink-0 flex-col border-r border-neon-500/10 bg-zinc-50/50 p-3 backdrop-blur-sm lg:flex',
              'dark:border-neon-500/10 dark:bg-zinc-950/55',
            )}
          >
            {sidebar}
          </aside>

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent
              side="left"
              showCloseButton
              className="w-full p-0 sm:max-w-sm"
            >
              <SheetHeader className="border-b border-zinc-200 p-4 text-left dark:border-zinc-800/70">
                <SheetTitle className="pf-heading text-base">
                  Forge conversations
                </SheetTitle>
                <SheetDescription className="pf-muted">
                  Switch between your saved chats with Forge.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col overflow-hidden p-3">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>

          <main className="relative flex flex-1 flex-col overflow-hidden">
            {/* Mobile-only conversations toggle (moved from old header per app-wide nav plan) */}
            <div className="lg:hidden flex items-center border-b border-neon-500/10 bg-zinc-950/60 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-sm border border-zinc-700/70"
                aria-label="Open conversations"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-4" aria-hidden />
              </Button>
              <span className="ml-2 text-xs font-mono uppercase tracking-widest text-zinc-500">
                Conversations
              </span>
            </div>

            <ForgeChat
              activeConversationId={activeId}
              hydrationToken={hydrationToken}
              seedScript={showSeedBanner ? seedScript : null}
              onCreateConversation={handleCreateConversation}
              onConversationActivity={handleConversationActivity}
              onUpdateScriptId={handleUpdateScriptId}
              onScrollOffset={handleScrollOffset}
            />
          </main>
        </div>

        {/* Reserve the ticker's bottom slice so it doesn't cover the input on tall mobile keyboards. */}
        <div aria-hidden className="h-9 shrink-0" />
      </div>
    </UserPlanProvider>
  );
}
