'use client';

import { STRATEGY_PRESETS, type StrategyPreset } from '@/lib/config/constants';

type PromptTemplatesProps = {
  activePreset: string | null;
  onSelect: (prompt: string, presetId: string) => void;
};

export function PromptTemplates({ activePreset, onSelect }: PromptTemplatesProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-400">Quick templates</p>
      <div className="flex flex-wrap gap-2">
        {STRATEGY_PRESETS.map((preset: StrategyPreset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.prompt, preset.id)}
              className={
                isActive
                  ? 'rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300 transition-colors'
                  : 'rounded-full border border-zinc-700/70 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300'
              }
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}