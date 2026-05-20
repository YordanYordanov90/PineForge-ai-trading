import { ShieldCheck } from 'lucide-react';
import { pfOutputChromeBar, pfOutputMuted } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';
import type { OutputTab } from '@/components/strategy/StrategyOutputCard';
import type { ValidationResult } from '@/components/strategy/ScriptOutput';

const TAB_PATH: Record<OutputTab, string> = {
  script: 'output://script.pine',
  breakdown: 'output://breakdown.md',
  checklist: 'output://checklist.md',
  health: 'output://health.json',
  backtest: 'output://backtest.md',
  alerts: 'output://alerts.json',
  compare: 'output://compare.diff',
};

type TerminalOutputChromeProps = {
  activeTab: OutputTab;
  isStreaming: boolean;
  validationResult: ValidationResult | null;
  isOutputBusy: boolean;
};

export function TerminalOutputChrome({
  activeTab,
  isStreaming,
  validationResult,
  isOutputBusy,
}: TerminalOutputChromeProps) {
  const showValid = validationResult?.isValid && !isOutputBusy;
  const showReview = validationResult && !validationResult.isValid && !isOutputBusy;

  return (
    <div
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 border-b px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider backdrop-blur-md supports-backdrop-filter:bg-zinc-100/90 dark:supports-backdrop-filter:bg-zinc-950/85',
        pfOutputChromeBar,
      )}
      aria-hidden
    >
      <div className="flex shrink-0 items-center gap-1">
        <span className="size-1.5 rounded-full bg-rose-500/40" />
        <span className="size-1.5 rounded-full bg-amber-500/40" />
        <span className="size-1.5 rounded-full bg-emerald-500/40" />
      </div>
      <span className={cn('min-w-0 truncate', pfOutputMuted)}>{TAB_PATH[activeTab]}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {isStreaming ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-400/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            streaming
          </span>
        ) : null}
        {showValid ? (
          <span className="inline-flex items-center gap-1 text-emerald-400/85">
            <ShieldCheck className="size-3" />
            valid
          </span>
        ) : null}
        {showReview ? (
          <span className="text-amber-400/85">review</span>
        ) : null}
      </span>
    </div>
  );
}
