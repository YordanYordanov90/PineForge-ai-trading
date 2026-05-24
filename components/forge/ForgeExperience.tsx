'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ArrowLeft, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ModeToggle } from '@/components/mode-toggle';
import { useClerkAppearance } from '@/hooks/useClerkAppearance';
import { useForgeConversations } from '@/hooks/useForgeConversations';
import { UserPlanProvider } from '@/lib/providers/UserPlanContext';
import { brandLogoParts } from '@/lib/brand';
import { cn } from '@/lib/utils';
import type { SavedConversation, SavedScript } from '@/lib/types';
import { ForgeChat } from '@/components/forge/ForgeChat';
import { ForgeConversationSidebar } from '@/components/forge/ForgeConversationSidebar';

/**
 * Top-level Forge page shell (spec 57 § Page Structure).
 *
 *  - Slim navbar with the PineForge brand, a back-to-Generate link,
 *    theme toggle, and Clerk user button.
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
  const { isLoaded, isSignedIn } = useAuth();
  const clerkAppearance = useClerkAppearance();
  const { prefix, accent } = brandLogoParts();

  const handleCreateConversation = useCallback(
    async (scriptId: number | null) => {
      const created = await conversations.createConversation(scriptId);
      if (created) {
        setActiveId(created.id);
        setSidebarOpen(false);
        // No `setHydrationToken` bump — fresh conversations start
        // empty and the chat panel already owns the in-flight first
        // message. Hydrating here would wipe it.
      }
      return created;
    },
    [conversations],
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

  const sidebar = useMemo(
    () => (
      <ForgeConversationSidebar
        conversations={conversations.conversations}
        activeConversationId={activeId}
        isCreating={conversations.isCreating}
        onSelectConversation={handleSelect}
        onCreateConversation={() => void handleCreateConversation(null)}
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
      handleCreateConversation,
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
      <div className="relative flex h-svh flex-1 flex-col">
        <div
          aria-hidden
          className="forge-terminal-grid forge-noise pointer-events-none absolute inset-0 opacity-60 will-change-[background-position]"
          style={parallaxStyle}
        />

        <header className="relative z-10 border-b border-emerald-500/20 bg-white/75 px-4 py-2.5 shadow-[0_1px_0_0_oklch(0.7_0.17_160/0.08)] backdrop-blur-md sm:px-6 dark:border-emerald-500/15 dark:bg-zinc-950/80 dark:shadow-[0_1px_24px_-8px_oklch(0.7_0.17_160/0.25)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-sm border border-zinc-200/80 lg:hidden dark:border-zinc-700/70"
                aria-label="Open conversations"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-4" aria-hidden />
              </Button>

              <Link
                href="/"
                className="flex items-center gap-2.5"
                aria-label="Back to PineForge home"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm border border-emerald-500/35 bg-emerald-500/10 shadow-[inset_0_0_12px_oklch(0.7_0.17_160/0.12)]">
                  <Sparkles className="size-4 text-emerald-500 dark:text-emerald-400" />
                </span>
                <span className="pf-heading hidden font-heading text-base font-bold tracking-tight sm:inline">
                  {prefix}
                  <span className="text-emerald-500">{accent}</span>
                  <span className="pf-muted ml-2 font-mono text-[10px] uppercase tracking-[0.3em]">
                    {'// Forge'}
                  </span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                asChild
                type="button"
                variant="ghost"
                size="sm"
                className="hidden rounded-sm font-mono text-[11px] uppercase tracking-widest sm:inline-flex"
              >
                <Link href="/generate">
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Generator
                </Link>
              </Button>
              <ModeToggle />
              {isLoaded && isSignedIn ? (
                <UserButton appearance={clerkAppearance} />
              ) : null}
            </div>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 overflow-hidden">
          <aside
            className={cn(
              'hidden w-72 shrink-0 flex-col border-r border-emerald-500/10 bg-zinc-50/50 p-3 backdrop-blur-sm lg:flex',
              'dark:border-emerald-500/10 dark:bg-zinc-950/55',
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
            <ForgeChat
              activeConversationId={activeId}
              hydrationToken={hydrationToken}
              seedScript={showSeedBanner ? seedScript : null}
              onCreateConversation={handleCreateConversation}
              onConversationActivity={handleConversationActivity}
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
