'use client';

import { Terminal } from 'lucide-react';
import { PROMPT_SUGGESTIONS } from '@/lib/config/prompt-suggestions';
import { SUGGESTION_CHIP_CLASS } from '@/components/strategy/script-output-styles';

type ScriptOutputIdleProps = {
  onSuggestionClick?: (prompt: string) => void;
};

export function ScriptOutputIdle({ onSuggestionClick }: ScriptOutputIdleProps) {
  return (
    <div className="relative flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:shadow-[0_0_24px_-8px_rgba(16,185,129,0.35)]">
        <Terminal className="h-6 w-6 text-emerald-600 dark:text-emerald-500/70" />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-500/80">
        $
        <span
          className="animate-blink-cursor ml-px inline-block h-3 w-1.5 bg-emerald-500/70 align-middle"
          aria-hidden
        />
        <span className="ml-1.5">awaiting script</span>
      </p>
      <p className="pf-heading mt-3 text-base font-medium">Output buffer empty</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500">
        Pick a starter below or describe your edge in the strategy field — then generate.
      </p>
      {onSuggestionClick ? (
        <div className="relative mt-8 w-full max-w-md space-y-2.5">
          <p className="text-xs text-zinc-500">Starter prompts</p>
          <div className="flex flex-wrap justify-center gap-2">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => onSuggestionClick(suggestion.prompt)}
                className={SUGGESTION_CHIP_CLASS}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
