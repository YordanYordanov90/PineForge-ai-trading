import { auth } from '@clerk/nextjs/server';
import { getUserPlanByClerkId } from '@/lib/db';
import { TemplateGrid } from '@/components/templates/TemplateGrid';
import { PRODUCT_NAME } from '@/lib/brand';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';

export const metadata = {
  title: `Strategy Templates Library | ${PRODUCT_NAME}`,
  description: 'Curated, production-grade Pine Script v5 templates. Browse, preview Health Score + Backtest plans, then load into the generator with one click.',
};

export default async function TemplatesPage() {
  const { userId } = await auth();
  const initialPlan = await getUserPlanByClerkId(userId);

  return (
    <div className="pf-page relative min-h-screen">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 pb-28 sm:py-14 sm:pb-32">
        <header className="mb-8">
          <div>
            <div className="pf-badge inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
              Curated Library
            </div>
            <h1 className="pf-heading mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Strategy Templates
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              High-quality, reviewed Pine Script v5 starting points. Each template ships with pre-computed Health Score, Backtest Summary, and ready-to-use alert templates.
            </p>
          </div>
        </header>

        <TemplateGrid initialPlan={initialPlan} />
      </div>
    </div>
  );
}
