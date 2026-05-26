'use client';

import { cn } from '@/lib/utils';
import { terminalActivePill } from '@/lib/ui/terminal-texture';
import { TEMPLATE_STYLES, TEMPLATE_DIFFICULTIES } from '@/lib/templates/templates';

type TemplateFilterBarProps = {
  activeStyle: string;
  onStyleChange: (style: string) => void;
  activeDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  resultCount: number;
  totalCount: number;
};

export function TemplateFilterBar({
  activeStyle,
  onStyleChange,
  activeDifficulty,
  onDifficultyChange,
  resultCount,
  totalCount,
}: TemplateFilterBarProps) {
  return (
    <div className="sticky top-0 z-20 -mx-1 border-b border-zinc-800 bg-[#0a0a0a]/95 pb-4 pt-3 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
      <div className="flex flex-wrap items-center gap-3">
        {/* Style filters */}
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_STYLES.map((style) => {
            const isActive = activeStyle === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => onStyleChange(style)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  isActive ? terminalActivePill : 'pf-pill',
                )}
                aria-pressed={isActive}
              >
                {style}
              </button>
            );
          })}
        </div>

        {/* Difficulty filters */}
        <div className="flex flex-wrap gap-1.5 border-l border-zinc-800 pl-3">
          {TEMPLATE_DIFFICULTIES.map((diff) => {
            const isActive = activeDifficulty === diff;
            return (
              <button
                key={diff}
                type="button"
                onClick={() => onDifficultyChange(diff)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  isActive ? terminalActivePill : 'pf-pill',
                )}
                aria-pressed={isActive}
              >
                {diff}
              </button>
            );
          })}
        </div>

        <div className="ml-auto text-xs text-zinc-500 tabular-nums">
          {resultCount} / {totalCount} templates
        </div>
      </div>
    </div>
  );
}
