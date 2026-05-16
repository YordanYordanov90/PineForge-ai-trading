'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_INSTRUCTION = 1000;

export type RefineChatProps = {
  disabled?: boolean;
  busy: boolean;
  onRefine: (instruction: string) => Promise<void>;
  /** Increment after a successful refine to clear the input. */
  resetKey?: number;
};

export function RefineChat({
  disabled = false,
  busy,
  onRefine,
  resetKey = 0,
}: RefineChatProps) {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    setInstruction('');
  }, [resetKey]);

  const len = instruction.length;
  const canSubmit =
    Boolean(instruction.trim()) &&
    len <= MAX_INSTRUCTION &&
    !disabled &&
    !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = instruction.trim();
    if (!trimmed || !canSubmit) return;
    await onRefine(trimmed);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-200">
        <MessageSquareText className="h-4 w-4 text-emerald-500/80" aria-hidden />
        Refine this script with PineForge
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="refine-instruction" className="text-zinc-400">
              What should change?
            </Label>
            <span
              className={cn(
                'text-xs tabular-nums',
                len > MAX_INSTRUCTION ? 'text-rose-400' : 'text-zinc-500',
              )}
              aria-live="polite"
            >
              {len} / {MAX_INSTRUCTION}
            </span>
          </div>
          <Textarea
            id="refine-instruction"
            placeholder='e.g. "Add trailing stop after 1R", "Make it work on 15m", "Add short signals"'
            value={instruction}
            onChange={(e) => setInstruction(e.target.value.slice(0, MAX_INSTRUCTION))}
            rows={3}
            disabled={disabled || busy}
            className="resize-none border-zinc-700/70 bg-black/40 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-400/30"
            aria-invalid={len > MAX_INSTRUCTION}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          aria-busy={busy}
          className="bg-emerald-500/90 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refining…
            </span>
          ) : (
            'Apply refinement'
          )}
        </Button>
      </form>
    </div>
  );
}
