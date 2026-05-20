'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { useClerkAppearance } from '@/hooks/useClerkAppearance';
import { StrategyForm, type StrategyFormHandle } from '@/components/strategy/StrategyForm';
import { ScriptHistory } from '@/components/strategy/ScriptHistory';
import { UserPlanProvider } from '@/context/UserPlanContext';
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
