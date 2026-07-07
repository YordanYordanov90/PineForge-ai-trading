'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { UpgradeToProButton } from '@/components/billing/UpgradeToProButton';
import { RevealOnScroll } from '@/components/landing/RevealOnScroll';
import {
  FREE_TIER_DAILY_GENERATIONS,
  PRO_TIER_DAILY_GENERATIONS,
  PRO_TIER_MONTHLY_PRICE_LABEL,
} from '@/lib/config/constants';

const FREE_FEATURES = [
  `${FREE_TIER_DAILY_GENERATIONS} AI generations per day`,
  'Fast model (recommended for most strategies)',
  'Script history, refine, and compare',
  'All output tabs: Script, Health, Alerts, Breakdown',
] as const;

const PRO_FEATURES = [
  `${PRO_TIER_DAILY_GENERATIONS} AI generations per day`,
  'All models including Balanced & Maximum Quality',
  'Higher concurrency for streaming generation',
  'Everything in Free, built for daily desk use',
] as const;

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Check className="mt-0.5 size-4 shrink-0 text-neon-600 dark:text-neon-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Free + Pro cards with one-click Pro checkout. Shared by `/` and `/pricing`. */
export function PricingPlans() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RevealOnScroll delay={0}>
        <div className="pf-feature-card flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-zinc-500">
            Free
          </p>
          <p className="pf-heading mt-2 font-heading text-3xl font-bold">$0</p>
          <p className="pf-muted mt-1 text-sm">No credit card required</p>
          <FeatureList items={FREE_FEATURES} />
          <div className="mt-auto">
            <Link
              href="/generate"
              className="motion-btn-press mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-6 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-neon-500/40 hover:bg-neon-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:border-neon-500/40 dark:hover:bg-neon-500/10"
            >
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={80}>
        <div className="pf-feature-card relative flex h-full flex-col overflow-hidden rounded-2xl border-neon-500/30 p-6 ring-1 ring-neon-500/20 sm:rounded-3xl sm:p-8">
          <div
            className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-neon-500/15 blur-2xl"
            aria-hidden
          />
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-neon-600 dark:text-neon-400">
            Pro
          </p>
          <p className="pf-heading mt-2 font-heading text-3xl font-bold">
            {PRO_TIER_MONTHLY_PRICE_LABEL}
            <span className="pf-muted ml-1.5 align-baseline font-sans text-sm font-normal">
              / month
            </span>
          </p>
          <p className="pf-muted mt-1 text-sm">For traders who generate daily</p>
          <FeatureList items={PRO_FEATURES} />
          <div className="mt-auto">
            <UpgradeToProButton />
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}
