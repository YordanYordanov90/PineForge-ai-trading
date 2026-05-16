'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clerkAppearance } from '@/lib/auth/clerk-appearance';
import { StrategyForm, type StrategyFormHandle } from '@/components/strategy/StrategyForm';
import { ScriptHistory } from '@/components/strategy/ScriptHistory';
import { ScriptHistorySidebar } from '@/components/strategy/ScriptHistorySidebar';
import { PRODUCT_NAME } from '@/lib/brand';
import type { SavedScript } from '@/lib/types';

const USER_SYNC_SESSION_KEY = 'pineforge_user_synced';
const LEGACY_USER_SYNC_SESSION_KEY = 'grokts_user_synced';

export function GenerateExperience() {
  const formRef = useRef<StrategyFormHandle>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || typeof window === 'undefined') return;
    if (
      sessionStorage.getItem(USER_SYNC_SESSION_KEY) === '1' ||
      sessionStorage.getItem(LEGACY_USER_SYNC_SESSION_KEY) === '1'
    ) {
      return;
    }

    void (async () => {
      try {
        const res = await fetch('/api/users/sync', { method: 'POST' });
        if (res.ok) {
          sessionStorage.setItem(USER_SYNC_SESSION_KEY, '1');
        }
      } catch {
        // retry on next visit
      }
    })();
  }, [isLoaded, isSignedIn]);

  const handleLoad = useCallback((entry: SavedScript) => {
    formRef.current?.loadSavedScript(entry);
  }, []);

  return (
    <>
      <header className="mb-10 sm:mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800/70 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Pine Script v5 · Alerts + SL/TP · Copy‑ready output
            </div>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {PRODUCT_NAME}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
              Describe entries, filters, and risk rules. Get Pine Script with 3 alert tiers and automatic
              Stop‑Loss / Take‑Profit lines.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 sm:pt-1">
            {isLoaded && isSignedIn ? (
              <UserButton appearance={clerkAppearance} />
            ) : null}
            <div className="xl:hidden">
              <ScriptHistory
                onLoad={handleLoad}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid items-start xl:grid-cols-[280px_1fr] xl:gap-8">
        <div className="sticky top-8 hidden h-[calc(100vh-4rem)] xl:block">
          <ScriptHistorySidebar onLoad={handleLoad} />
        </div>
        <div className="min-w-0">
          <StrategyForm
            ref={formRef}
            onRequestOpenHistory={() => setHistoryOpen(true)}
          />
        </div>
      </div>
    </>
  );
}
