'use client';

import { GrokModel, GROK_MODELS } from '@/lib/config/constants';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ModelSelectorProps = {
  selectedModel: GrokModel['id'];
  onSelect: (modelId: GrokModel['id']) => void;
};

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const modelLabelId = 'model-selector-label';

  return (
    <div className="space-y-2">
      <p id={modelLabelId} className="text-xs text-zinc-400">
        Model
      </p>
      <TooltipProvider>
        <div 
          className="flex rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-1"
          role="radiogroup"
          aria-labelledby={modelLabelId}
        >
          {GROK_MODELS.map((model, index) => {
            const isSelected = selectedModel === model.id;
            const isFirst = index === 0;
            const isLast = index === GROK_MODELS.length - 1;
            const isRecommended = model.recommended === true;

            return (
              <Tooltip key={model.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => onSelect(model.id)}
                    className={cn(
                      'relative flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 px-1.5 py-2 text-center transition-all duration-200',
                      isFirst && 'rounded-l-md',
                      isLast && 'rounded-r-md',
                      isSelected &&
                        'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50 ring-inset',
                      !isSelected &&
                        'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
                      !isSelected &&
                        isRecommended &&
                        'ring-1 ring-emerald-500/20 ring-inset',
                    )}
                  >
                    <span className="text-[11px] font-medium leading-tight sm:text-xs">
                      {model.label}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] leading-none tabular-nums',
                        isSelected ? 'text-emerald-400/85' : 'text-zinc-500',
                      )}
                    >
                      {model.speedHint}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{model.tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
