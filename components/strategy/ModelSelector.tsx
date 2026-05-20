'use client';

import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useUserPlan } from '@/context/UserPlanContext';
import { DEFAULT_MODEL, GrokModel, GROK_MODELS } from '@/lib/config/constants';
import { cn } from '@/lib/utils';
import { terminalActiveInset } from '@/lib/ui/terminal-texture';
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

const PRO_ONLY_TOAST =
  'Only Pro users can select this model. Upgrade to unlock Balanced and Maximum Quality.';

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const plan = useUserPlan();
  const isPro = plan === 'pro';
  const modelLabelId = 'model-selector-label';

  const handleSelect = (modelId: GrokModel['id']) => {
    const isLocked = !isPro && modelId !== DEFAULT_MODEL;
    if (isLocked) {
      toast.error(PRO_ONLY_TOAST);
      return;
    }
    onSelect(modelId);
  };

  return (
    <div className="space-y-2">
      <p id={modelLabelId} className="pf-label-muted">
        Model
      </p>
      <TooltipProvider>
        <div 
          className="pf-model-track flex rounded-lg p-1"
          role="radiogroup"
          aria-labelledby={modelLabelId}
        >
          {GROK_MODELS.map((model, index) => {
            const isSelected = selectedModel === model.id;
            const isFirst = index === 0;
            const isLast = index === GROK_MODELS.length - 1;
            const isRecommended = model.recommended === true;
            const isLocked = !isPro && model.id !== DEFAULT_MODEL;

            return (
              <Tooltip key={model.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={isLocked}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => handleSelect(model.id)}
                    className={cn(
                      'relative flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 px-1.5 py-2 text-center transition-all duration-200',
                      isFirst && 'rounded-l-md',
                      isLast && 'rounded-r-md',
                      isSelected &&
                        cn('ring-1 ring-emerald-500/50 ring-inset', terminalActiveInset),
                      !isSelected &&
                        !isLocked &&
                        'pf-model-option',
                      !isSelected &&
                        isRecommended &&
                        !isLocked &&
                        'ring-1 ring-emerald-500/20 ring-inset',
                      isLocked && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium leading-tight sm:text-xs">
                      {isLocked ? (
                        <Lock className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
                      ) : null}
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
                <TooltipContent side="top">
                  {isLocked ? `Pro only — ${model.tooltip}` : model.tooltip}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
