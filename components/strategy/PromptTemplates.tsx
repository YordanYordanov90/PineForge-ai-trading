'use client';

import { STRATEGY_PRESETS, type StrategyPreset } from '@/lib/config/constants';
import { cn } from '@/lib/utils';
import { terminalActivePill } from '@/lib/ui/terminal-texture';

type PromptTemplatesProps = {
  activePreset: string | null;
  onSelect: (prompt: string, presetId: string) => void;
};

export function PromptTemplates({ activePreset, onSelect }: PromptTemplatesProps) {
  return (
    <div className="space-y-2">
      <p className="pf-label-muted">Quick templates</p>
      <div className="flex flex-wrap gap-2">
        {STRATEGY_PRESETS.map((preset: StrategyPreset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset.prompt, preset.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                isActive
                  ? terminalActivePill
                  : 'pf-pill',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
