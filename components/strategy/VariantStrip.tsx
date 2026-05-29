'use client';

import { useMemo } from 'react';
import { Layers, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VariantCard, type VariantCardData } from '@/components/strategy/VariantCard';
import {
  VARIANT_AXES,
  VARIANT_DEFINITIONS,
} from '@/lib/ai/prompts/variants';
import type { VariantAxis } from '@/lib/api/validation';

type VariantStripProps = {
  isOpen: boolean;
  onToggle: () => void;
  variants: VariantCardData[];
  isGenerating: boolean;
  plan: string; // 'free' | 'pro'
  onLoadVariant: (variant: VariantCardData) => void;
  onUpgradeClick?: () => void;
  className?: string;
};

export function VariantStrip({
  isOpen,
  onToggle,
  variants,
  isGenerating,
  plan,
  onLoadVariant,
  onUpgradeClick,
  className,
}: VariantStripProps) {
  const count = variants.length || (plan === 'pro' ? 3 : 1);
  const isPro = plan === 'pro';

  const headerLabel = isGenerating
    ? `Generating ${count} variant${count === 1 ? '' : 's'}…`
    : `${count} Variant${count === 1 ? '' : 's'}`;

  const lockedAxes: VariantAxis[] = isPro ? [] : ['signal-quality', 'indicator-swap'];

  /** Free plan: show locked B/C placeholders alongside Variant A (spec 64). */
  const displayVariants = useMemo((): VariantCardData[] => {
    if (isPro) return variants;
    const byAxis = new Map(variants.map((v) => [v.axis, v]));
    return VARIANT_AXES.map((axis) => {
      const existing = byAxis.get(axis);
      if (existing) return existing;
      const def = VARIANT_DEFINITIONS[axis];
      return {
        axis,
        label: def.label,
        script: '',
        prompt: '',
      };
    });
  }, [variants, isPro]);

  const gridClass = 'grid grid-cols-1 gap-3 sm:grid-cols-3';

  return (
    <div
      className={cn(
        'mt-3 rounded-xl border border-zinc-800 bg-[#111111]/80',
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-t-xl px-3 py-2 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-500/40"
        aria-expanded={isOpen}
        aria-controls="variant-strip-content"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-neon-400/80" aria-hidden />
          <span className="font-mono text-xs uppercase tracking-[0.75px] text-zinc-300">
            {headerLabel}
          </span>
          {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-400/70" aria-hidden />}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden />
        )}
      </button>

      {isOpen && (
        <div id="variant-strip-content" className="border-t border-zinc-800 p-3">
          {isGenerating ? (
            <div className="flex items-center justify-center py-6 text-xs text-zinc-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Calling Grok for {count} tuned variations…
            </div>
          ) : variants.length > 0 ? (
            <div className={gridClass}>
              {(isPro ? variants : displayVariants).map((v) => (
                <VariantCard
                  key={v.axis}
                  variant={v}
                  isLocked={lockedAxes.includes(v.axis)}
                  onLoad={onLoadVariant}
                  onUpgradeClick={onUpgradeClick}
                />
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-zinc-500">
              No variants generated. Try again after a successful script output.
            </div>
          )}
          {!isPro && !isGenerating && (
            <p className="mt-2 text-center text-[10px] text-amber-400/80">
              Free plan shows Variant A. <span className="underline">Upgrade for B + C.</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
