'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquareText } from 'lucide-react';
import { pfRefineHeading, pfRefinePanel } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

const MAX_INSTRUCTION = 1000;

export type RefineChatProps = {
  disabled?: boolean;
  busy: boolean;
  onRefine: (instruction: string) => Promise<void>;
  /** Increment after a successful refine to clear the input. */
  resetKey?: number;
  /** Prefill from Health Score next steps; bump nonce to apply. */
  prefillInstruction?: string;
  prefillNonce?: number;
};

export function RefineChat({
  disabled = false,
  busy,
  onRefine,
  resetKey = 0,
  prefillInstruction = '',
  prefillNonce = 0,
}: RefineChatProps) {
  const [instruction, setInstruction] = useState('');
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const [prevPrefillNonce, setPrevPrefillNonce] = useState(prefillNonce);
  const containerRef = useRef<HTMLDivElement>(null);

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setInstruction('');
  }

  if (prevPrefillNonce !== prefillNonce) {
    setPrevPrefillNonce(prefillNonce);
    if (prefillNonce && prefillInstruction.trim()) {
      setInstruction(prefillInstruction.trim().slice(0, MAX_INSTRUCTION));
    }
  }

  useEffect(() => {
    if (!prefillNonce || !prefillInstruction.trim()) return;
    const handle = window.setTimeout(() => {
      const el = document.getElementById('refine-instruction');
      if (el instanceof HTMLTextAreaElement) {
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
    return () => window.clearTimeout(handle);
  }, [prefillNonce, prefillInstruction]);

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
    <div
      ref={containerRef}
      id="refine-chat"
      className={cn('scroll-mt-4', pfRefinePanel)}
    >
      <div className={cn('mb-3 flex items-center gap-2', pfRefineHeading)}>
        <MessageSquareText className="h-4 w-4 text-neon-600 dark:text-neon-500/80" aria-hidden />
        Refine this script with PineForge
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="refine-instruction" className="pf-label-muted">
              What should change?
            </Label>
            <span
              className={cn(
                'text-xs tabular-nums',
                len > MAX_INSTRUCTION
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-600 dark:text-zinc-500',
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
            className="pf-input resize-none focus-visible:ring-neon-400/30"
            aria-invalid={len > MAX_INSTRUCTION}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          aria-busy={busy}
          className="bg-neon-500/90 text-zinc-950 hover:bg-neon-400 disabled:opacity-50"
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
