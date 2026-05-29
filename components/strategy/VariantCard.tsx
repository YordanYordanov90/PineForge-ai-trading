'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import type { VariantAxis } from '@/lib/api/validation';

export interface VariantCardData {
  axis: VariantAxis;
  label: string;
  script: string;
  prompt: string;
}

type VariantCardProps = {
  variant: VariantCardData;
  isLocked?: boolean;
  onLoad: (variant: VariantCardData) => void;
  onUpgradeClick?: () => void;
};

function getPreviewLines(script: string, maxLines = 3): string[] {
  const lines = script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, maxLines);
  return lines.length ? lines : ['// (empty)'];
}

export function VariantCard({ variant, isLocked = false, onLoad, onUpgradeClick }: VariantCardProps) {
  const preview = getPreviewLines(variant.script);

  const handleLoad = () => {
    if (isLocked) {
      onUpgradeClick?.();
      return;
    }
    onLoad(variant);
  };

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs',
        isLocked && 'opacity-60',
      )}
      role="article"
      aria-label={`${variant.label} variant`}
    >
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-950/90 px-2 py-1 text-[10px] text-zinc-400">
            <Lock className="h-3 w-3" aria-hidden />
            <span>Pro</span>
          </div>
        </div>
      )}

      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-neon-400/90">
          {variant.label}
        </span>
        <span className="font-mono text-[9px] text-zinc-600">{variant.axis}</span>
      </div>

      <pre className="mb-2 flex-1 overflow-hidden rounded bg-black/40 p-2 font-mono text-[9px] leading-tight text-neon-300/80">
        {preview.map((line, i) => (
          <div key={i} className="truncate">
            {line.length > 42 ? `${line.slice(0, 39)}…` : line}
          </div>
        ))}
      </pre>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLoad}
        disabled={isLocked && !onUpgradeClick}
        className={cn(
          'h-7 w-full border border-zinc-800 text-[10px] uppercase tracking-widest hover:bg-neon-500/10 hover:text-neon-300 hover:border-neon-500/40',
          isLocked && 'cursor-pointer',
        )}
        aria-label={isLocked ? `Upgrade to load ${variant.label}` : `Load ${variant.label} variant`}
      >
        {isLocked ? 'Upgrade to load' : 'Load'}
      </Button>
    </div>
  );
}
