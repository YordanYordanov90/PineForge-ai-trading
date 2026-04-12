'use client';

import { GrokModel, GROK_MODELS } from '@/lib/constants';

type ModelSelectorProps = {
  selectedModel: GrokModel['id'];
  onSelect: (modelId: GrokModel['id']) => void;
};

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">Model</p>
        <span className="text-xs text-zinc-500">
          {GROK_MODELS.find(m => m.id === selectedModel)?.description}
        </span>
      </div>
      <div className="flex rounded-lg border border-zinc-800/70 bg-zinc-950/60 p-1">
        {GROK_MODELS.map((model, index) => {
          const isSelected = selectedModel === model.id;
          const isFirst = index === 0;
          const isLast = index === GROK_MODELS.length - 1;

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelect(model.id)}
              className={`
                relative flex-1 px-2 py-2 text-xs font-medium transition-all duration-200
                ${isFirst ? 'rounded-l-md' : ''}
                ${isLast ? 'rounded-r-md' : ''}
                ${isSelected
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }
              `}
            >
              {model.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
