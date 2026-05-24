'use client';

import { BarChart3, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const FORGE_BOOT_LINES = [
  '[OK] Memory loaded',
  '[OK] Tools online',
  '[OK] Strategies indexed',
  '[OK] Agent ready',
] as const;

const FORGE_SUGGESTIONS: ReadonlyArray<{ label: string; prompt: string }> = [
  {
    label: 'Analyze my last strategy',
    prompt: 'Analyze my last strategy and tell me what to improve.',
  },
  {
    label: 'Help me build a BTC scalping strategy',
    prompt:
      'Help me build a 5-minute BTC scalping strategy. Suggest indicators and risk rules.',
  },
  {
    label: 'Compare my starred scripts',
    prompt:
      'Look at my starred scripts. Which one has the strongest structure and why?',
  },
  {
    label: 'What indicators work for 15m crypto?',
    prompt:
      'What indicators tend to work well for 15-minute crypto strategies? Reference my history if relevant.',
  },
];

type ForgeEmptyStateProps = {
  onSuggest: (prompt: string) => void;
  disabled?: boolean;
};

export function ForgeEmptyState({ onSuggest, disabled }: ForgeEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative forge-fade-up">
        <div
          aria-hidden
          className="forge-pulse-ring absolute -inset-3 rounded-sm border border-emerald-500/25"
        />
        <div className="relative flex size-16 items-center justify-center gap-1 rounded-sm border border-emerald-500/35 bg-zinc-900/80 shadow-[inset_0_0_24px_oklch(0.7_0.17_160/0.12)] dark:bg-zinc-950/90">
          <Terminal
            className="size-7 text-emerald-500 dark:text-emerald-400"
            aria-hidden
          />
          <BarChart3
            className="size-5 text-emerald-500/70 dark:text-emerald-400/70"
            aria-hidden
          />
        </div>
      </div>

      <ul
        aria-hidden
        className="mt-6 flex flex-col items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600/80 dark:text-emerald-400/70"
      >
        {FORGE_BOOT_LINES.map((line, index) => (
          <li
            key={line}
            className="forge-boot-line"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            {line}
          </li>
        ))}
      </ul>

      <p
        className="forge-fade-up mt-5 font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400/80"
        style={{ animationDelay: '520ms' }}
      >
        [ Forge Agent Online ]
      </p>
      <h2
        className="forge-fade-up pf-heading mt-3 text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
        style={{ animationDelay: '580ms' }}
      >
        Start a conversation with Forge
      </h2>
      <p
        className="forge-fade-up pf-muted mt-3 max-w-md text-sm leading-relaxed"
        style={{ animationDelay: '640ms' }}
      >
        Forge orchestrates Health Score, Backtesting, Alerts, and your
        script history. Ask anything about your strategies.
      </p>

      <ul
        role="list"
        className="mt-10 flex w-full max-w-2xl flex-col gap-2 sm:max-w-xl"
      >
        {FORGE_SUGGESTIONS.map((s, index) => (
          <li
            key={s.label}
            className="forge-fade-up"
            style={{ animationDelay: `${700 + index * 70}ms` }}
          >
            <button
              type="button"
              role="button"
              aria-label={`Send suggestion: ${s.label}`}
              disabled={disabled}
              onClick={() => onSuggest(s.prompt)}
              className={cn(
                'group/forge-chip relative w-full overflow-hidden rounded-sm border border-zinc-200/80 bg-white/60 px-4 py-3 text-left text-sm transition-all',
                'before:absolute before:inset-y-0 before:left-0 before:w-0 before:bg-emerald-500/80 before:transition-[width] before:duration-200',
                'hover:border-emerald-500/40 hover:bg-emerald-500/[0.04] hover:before:w-0.5',
                'dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:hover:bg-emerald-500/[0.08]',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              <span className="relative flex items-start gap-2 font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <span
                  className="shrink-0 text-emerald-600 transition-colors group-hover/forge-chip:text-emerald-500 dark:text-emerald-400"
                  aria-hidden
                >
                  &gt;
                </span>
                <span>{s.label}</span>
              </span>
              <span className="pf-muted relative mt-1.5 block pl-5 text-xs leading-relaxed">
                {s.prompt}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
