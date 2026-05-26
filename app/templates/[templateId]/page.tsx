import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { users } from '@/drizzle/schema';
import { db } from '@/lib/db';
import { getTemplateById } from '@/lib/templates/templates';
import { PRODUCT_NAME } from '@/lib/brand';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';
import { ArrowLeft } from 'lucide-react';
import { CopyScriptButton } from '@/components/templates/CopyScriptButton';

export async function generateMetadata({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const t = getTemplateById(templateId);
  return {
    title: t ? `${t.title} | ${PRODUCT_NAME} Templates` : 'Template Not Found',
    description: t?.description ?? 'Strategy template detail',
  };
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = getTemplateById(templateId);

  if (!template) {
    notFound();
  }

  const { userId } = await auth();
  let plan = 'free';
  if (userId) {
    const [u] = await db.select({ plan: users.plan }).from(users).where(eq(users.clerkId, userId)).limit(1);
    plan = u?.plan ?? 'free';
  }

  const canAccess = !template.isPro || plan === 'pro';

  return (
    <div className="pf-page relative min-h-screen">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8 pb-24">
        <Link href="/templates" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to library
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{template.title}</h1>
              {template.isPro && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">Pro</span>}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{template.description}</p>
          </div>

          <Link
            href={`/generate?templateId=${template.id}`}
            className="rounded-md border border-neon-500/40 bg-neon-500/10 px-4 py-2 text-sm font-medium text-neon-400 transition hover:bg-neon-500/15"
          >
            Use as base in Generator →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Meta */}
          <div className="pf-card p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-500">Difficulty</span><div className="font-medium capitalize">{template.difficulty}</div></div>
              <div><span className="text-zinc-500">Market</span><div className="font-medium">{template.market}</div></div>
              <div><span className="text-zinc-500">Timeframe</span><div className="font-medium">{template.timeframe}</div></div>
              <div><span className="text-zinc-500">Direction</span><div className="font-medium">{template.direction}</div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">{tag}</span>
              ))}
            </div>
          </div>

          {/* Health Score (static) */}
          <div className="pf-card p-4">
            <div className="text-sm font-medium text-emerald-400">Health Score</div>
            {template.healthScore ? (
              <div className="mt-2">
                <div className="text-3xl font-semibold tabular-nums text-emerald-400">{template.healthScore.score}/10</div>
                <div className="text-sm font-medium text-zinc-200">{template.healthScore.verdict}</div>
                <p className="mt-2 text-xs text-zinc-400">{template.healthScore.summary}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                  <div><span className="text-emerald-400">Strengths:</span> {template.healthScore.strengths.join(' · ')}</div>
                  <div><span className="text-rose-400">Risks:</span> {template.healthScore.risks.join(' · ')}</div>
                </div>
              </div>
            ) : <div className="text-xs text-zinc-500 mt-2">No pre-computed score for this template.</div>}
          </div>
        </div>

        {/* Backtest Summary */}
        <div className="mt-4 pf-card p-4">
          <div className="text-sm font-medium text-emerald-400">Backtest Summary</div>
          {template.backtestSummary ? (
            <div className="mt-2 text-sm">
              <div className="font-medium">{template.backtestSummary.title}</div>
              <p className="mt-1 text-xs text-zinc-400">{template.backtestSummary.markdown}</p>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                <div><span className="text-zinc-500">Recommended Timeframes:</span> {template.backtestSummary.sections.recommendedTimeframes.join(', ')}</div>
                <div><span className="text-zinc-500">Recommended Markets:</span> {template.backtestSummary.sections.recommendedMarkets.join(', ')}</div>
                <div><span className="text-zinc-500">Equity Curve Checks:</span> {template.backtestSummary.sections.equityCurveChecks.join(' · ')}</div>
                <div><span className="text-amber-400">Failure Modes:</span> {template.backtestSummary.sections.failureModes.join(' · ')}</div>
              </div>
            </div>
          ) : <div className="text-xs text-zinc-500 mt-2">No backtest summary.</div>}
        </div>

        {/* Alert Templates (static) */}
        <div className="mt-4 pf-card p-4">
          <div className="text-sm font-medium text-emerald-400">Alert Templates (pre-generated)</div>
          {template.alertTemplates ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {template.alertTemplates.templates.map((t) => (
                <div key={t.provider} className="rounded border border-zinc-800 p-3 text-xs">
                  <div className="font-medium text-zinc-200">{t.label} — {t.provider}</div>
                  <div className="mt-1 text-zinc-400">{t.description}</div>
                  <pre className="mt-2 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px] text-neon-300/90">{t.messageJson}</pre>
                  {t.notes.length > 0 && <div className="mt-1 text-[10px] text-zinc-500">Notes: {t.notes.join(' · ')}</div>}
                </div>
              ))}
            </div>
          ) : <div className="text-xs text-zinc-500 mt-2">No alert templates.</div>}
        </div>

        {/* Full Script */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-emerald-400">Full Pine Script v5</div>
            <CopyScriptButton script={template.script} />
          </div>
          <pre className="terminal-code-surface max-h-[520px] overflow-auto rounded-xl p-4 text-[12px] leading-tight text-neon-300/90">
{template.script}
          </pre>
        </div>

        {!canAccess && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            This is a Pro-only template. <Link href="/pricing" className="underline">Upgrade</Link> to load it into the generator and access the full library.
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href={`/generate?templateId=${template.id}`} className="inline-flex items-center gap-2 rounded-full border border-neon-500/40 bg-neon-500/10 px-5 py-2 text-sm font-medium text-neon-400 transition hover:bg-neon-500/15">
            Load this template into the generator →
          </Link>
        </div>
      </div>
    </div>
  );
}
