'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useClerkAppearance } from '@/hooks/useClerkAppearance';
import { StrategyForm, type StrategyFormHandle } from '@/components/strategy/StrategyForm';
import { ScriptHistory } from '@/components/strategy/ScriptHistory';
import { UserPlanProvider } from '@/lib/providers/UserPlanContext';
import { PRODUCT_NAME } from '@/lib/brand';
import type { SavedScript } from '@/lib/types';

const USER_SYNC_SESSION_KEY = 'pineforge_user_synced';
const LEGACY_USER_SYNC_SESSION_KEY = 'grokts_user_synced';

type GenerateExperienceProps = {
  initialPlan: string;
};

export function GenerateExperience({ initialPlan }: GenerateExperienceProps) {
  const formRef = useRef<StrategyFormHandle>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const clerkAppearance = useClerkAppearance();

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
    <UserPlanProvider plan={initialPlan}>
      <header className="mb-10 sm:mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="pf-badge inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Pine Script v5 · Alerts + SL/TP · Copy‑ready output
            </div>
            <h1 className="pf-heading mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {PRODUCT_NAME}
            </h1>
            <p className="pf-muted mt-3 max-w-2xl text-pretty text-sm leading-relaxed sm:text-base">
              Describe entries, filters, and risk rules. Get Pine Script with 3 alert tiers and automatic
              Stop‑Loss / Take‑Profit lines.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3 sm:pt-1">
            {isLoaded && isSignedIn ? (
              <Link
                href="/forge"
                className="pf-nav-muted inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-700 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-emerald-500/15 dark:text-emerald-300"
                aria-label="Open Forge agent"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Forge
                <span
                  aria-hidden
                  className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300"
                >
                  New
                </span>
              </Link>
            ) : null}
            <ModeToggle />
            <ScriptHistory
              onLoad={handleLoad}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
            />
            {isLoaded && isSignedIn ? (
              <UserButton appearance={clerkAppearance} />
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-w-0">
        <StrategyForm
          ref={formRef}
          onRequestOpenHistory={() => setHistoryOpen(true)}
        />
      </div>
    </UserPlanProvider>
  );
}
