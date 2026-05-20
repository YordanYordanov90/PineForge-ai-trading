import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import {
  FREE_TIER_DAILY_GENERATIONS,
  PRO_TIER_DAILY_GENERATIONS,
} from '@/lib/config/constants';
import { RevealOnScroll } from './RevealOnScroll';

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
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LandingPricingTeaser() {
  return (
    <section id="pricing" className="mb-20 sm:mb-32 lg:mb-40">
      <RevealOnScroll className="mb-10 text-center sm:mb-14">
        <h2 className="pf-heading font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Start free.{' '}
          <span className="text-emerald-600 dark:text-emerald-500">Scale when ready.</span>
        </h2>
        <p className="pf-muted mx-auto mt-3 max-w-2xl text-sm sm:text-base">
          Same generator, same Pine output — Pro unlocks volume and premium models.
        </p>
      </RevealOnScroll>

      <div className="grid gap-6 md:grid-cols-2">
        <RevealOnScroll delay={0}>
          <div className="pf-feature-card flex h-full flex-col rounded-2xl p-6 sm:rounded-3xl sm:p-8">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-zinc-500">
              Free
            </p>
            <p className="pf-heading mt-2 font-heading text-3xl font-bold">$0</p>
            <p className="pf-muted mt-1 text-sm">No credit card required</p>
            <FeatureList items={FREE_FEATURES} />
            <Link
              href="/generate"
              className="motion-btn-press mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-6 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:border-emerald-500/40 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
            >
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <div className="pf-feature-card relative flex h-full flex-col overflow-hidden rounded-2xl border-emerald-500/30 p-6 ring-1 ring-emerald-500/20 sm:rounded-3xl sm:p-8">
            <div
              className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-emerald-500/15 blur-2xl"
              aria-hidden
            />
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Pro
            </p>
            <p className="pf-heading mt-2 font-heading text-3xl font-bold">Pro desk</p>
            <p className="pf-muted mt-1 text-sm">For traders who generate daily</p>
            <FeatureList items={PRO_FEATURES} />
            <Link
              href="/pricing"
              className="motion-btn-press mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              See full pricing
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
