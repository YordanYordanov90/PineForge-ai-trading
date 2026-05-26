'use client';

import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrategyTemplate } from '@/lib/templates/templates';
import { toast } from 'sonner';

type TemplateCardProps = {
  template: StrategyTemplate;
  userPlan: string;
  onUseAsBase: (id: string) => void;
};

function HealthBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const color =
    score >= 8 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' :
    score >= 6 ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' :
    'text-rose-400 border-rose-500/40 bg-rose-500/10';
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', color)}>
      Health {score}/10
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: StrategyTemplate['difficulty'] }) {
  const styles = {
    beginner: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    intermediate: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    advanced: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', styles[difficulty])}>
      {difficulty}
    </span>
  );
}

export function TemplateCard({ template, userPlan, onUseAsBase }: TemplateCardProps) {
  const canAccess = !template.isPro || userPlan === 'pro';

  const handleUse = () => {
    if (canAccess) {
      onUseAsBase(template.id);
    } else {
      toast.error('Pro template — upgrade to unlock the full library.', {
        action: {
          label: 'View pricing',
          onClick: () => window.location.assign('/pricing'),
        },
      });
    }
  };

  return (
    <div className="pf-card group flex h-full flex-col overflow-hidden transition-all hover:border-zinc-700">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-100">{template.title}</h3>
            {template.isPro && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                <Lock className="h-3 w-3" /> Pro
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{template.description}</p>
        </div>
        <DifficultyBadge difficulty={template.difficulty} />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{template.market}</span>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{template.timeframe}</span>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{template.direction}</span>
          </div>

          <div className="flex items-center justify-between">
            <HealthBadge score={template.healthScore?.score ?? null} />
            <div className="text-[10px] text-zinc-500">{template.tags.slice(0, 2).join(' · ')}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleUse}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-neon-500/40 bg-neon-500/10 px-3 py-1.5 text-xs font-medium text-neon-400 transition hover:bg-neon-500/15 active:bg-neon-500/20"
          >
            Use as base <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <Link
            href={`/templates/${template.id}`}
            className="flex items-center justify-center rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
