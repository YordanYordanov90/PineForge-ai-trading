'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  pfOutputBody,
  pfOutputBorder,
  pfOutputMuted,
} from '@/lib/ui/terminal-texture';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';

type AssumptionsSectionProps = {
  assumptions?: StrategyAssumptions | null;
  className?: string;
};

/**
 * Assumptions section (spec 60).
 * Renders inside the Breakdown tab. Amber tint matching "Common Failure Modes".
 * Empty state for pre-60 scripts or when the block was absent.
 */
export function AssumptionsSection({
  assumptions,
  className,
}: AssumptionsSectionProps) {
  const items = assumptions?.items ?? [];

  return (
    <div className={cn('mt-6 border-t pt-5', pfOutputBorder, className)}>
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden />
        <p className={cn('text-sm font-medium', pfOutputBody)}>Assumptions</p>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-1.5 pl-1 text-sm">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-amber-900/90 dark:text-amber-100/90"
            >
              • {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn('text-sm', pfOutputMuted)}>
          No assumptions recorded — regenerate to get an analysis.
        </p>
      )}

      <p className={cn('mt-3 text-xs', pfOutputMuted)}>
        These conditions are what the generated strategy was designed for. If your
        market or asset differs, results may vary.
      </p>
    </div>
  );
}
