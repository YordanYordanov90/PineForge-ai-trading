'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal } from 'lucide-react';
import { highlightPineScript } from '@/lib/ai/highlight';
import { PROMPT_SUGGESTIONS } from '@/lib/config/prompt-suggestions';
import { cn } from '@/lib/utils';
import { terminalCursorStream } from '@/lib/ui/terminal-texture';

const SUGGESTION_CHIP_CLASS =
  'pf-pill rounded-full px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30';

const CODE_BLOCK_CLASS =
  'pf-code-text relative max-h-[640px] overflow-auto p-6 text-sm leading-relaxed';

export type ValidationResult = {
  hasVersion: boolean;
  hasDeclaration: boolean;
  hasAlert: boolean;
  bracketsMatch: boolean;
  isValid: boolean;
};

export function validateScript(script: string): ValidationResult {
  const hasVersion = script.includes('//@version=5');
  const hasDeclaration = /indicator\(|strategy\(/.test(script);
  const hasAlert = script.includes('alertcondition(') || script.includes('alert(');
  const openBrackets = (script.match(/\(/g) ?? []).length;
  const closeBrackets = (script.match(/\)/g) ?? []).length;
  const bracketsMatch = openBrackets === closeBrackets;
  return {
    hasVersion,
    hasDeclaration,
    hasAlert,
    bracketsMatch,
    isValid: hasVersion && hasDeclaration && hasAlert && bracketsMatch,
  };
}

type ScriptOutputProps = {
  script: string;
  isGenerating: boolean;
  isStreaming: boolean;
  isIdle: boolean;
  /** When set, settled script is an editable textarea (for manual tweaks + Compare). */
  onScriptChange?: (value: string) => void;
  /** Fills the strategy field and focuses it (output empty state chips). */
  onSuggestionClick?: (prompt: string) => void;
};

export function ScriptOutput({
  script,
  isGenerating,
  isStreaming,
  isIdle,
  onScriptChange,
  onSuggestionClick,
}: ScriptOutputProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    if (onScriptChange) {
      return;
    }
    if (isGenerating || !script) {
      queueMicrotask(() => {
        setHighlightedHtml(null);
      });
      return;
    }
    let cancelled = false;
    highlightPineScript(script).then((html) => {
      if (!cancelled) setHighlightedHtml(html);
    });
    return () => { cancelled = true; };
  }, [onScriptChange, isGenerating, script]);

  if (isIdle) {
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

  if (isGenerating && !script) {
    return (
      <div className="relative space-y-3 p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-[38%] rounded-md bg-zinc-800/60" />
          <Skeleton className="h-4 w-[18%] rounded-md bg-zinc-800/40" />
        </div>
        <Skeleton className="h-4 w-[92%] rounded-md bg-zinc-800/50" />
        <Skeleton className="h-4 w-[84%] rounded-md bg-zinc-800/50" />
        <Skeleton className="h-4 w-[88%] rounded-md bg-zinc-800/50" />
        <Skeleton className="h-4 w-[76%] rounded-md bg-zinc-800/50" />
        <Skeleton className="h-4 w-[90%] rounded-md bg-zinc-800/50" />
        <Skeleton className="h-4 w-[66%] rounded-md bg-zinc-800/45" />
        <div className="pt-2">
          <Skeleton className="h-4 w-[72%] rounded-md bg-zinc-800/40" />
        </div>
      </div>
    );
  }

  if (isStreaming) {
    return (
      <div className={CODE_BLOCK_CLASS}>
        <p
          className="mb-3 font-mono text-[10px] uppercase tracking-widest text-emerald-500/70"
          aria-hidden
        >
          pineforge stream · {script.length} chars
        </p>
        <pre className="m-0 overflow-visible p-0">
          <code className="font-mono">
            {script}
            <span
              className={cn(
                'animate-blink-cursor ml-0.5 inline-block h-4 w-2 bg-emerald-400 align-text-bottom',
                terminalCursorStream,
              )}
            />
          </code>
        </pre>
      </div>
    );
  }

  const settledEditable = Boolean(onScriptChange && !isGenerating && !isStreaming && !isIdle);

  if (settledEditable) {
    return (
      <textarea
        id="generated-pine-script"
        aria-label="Generated Pine Script — editable"
        spellCheck={false}
        value={script}
        onChange={(e) => {
          onScriptChange?.(e.target.value);
        }}
        className="pf-code-text box-border max-h-[640px] min-h-[320px] w-full resize-y border-0 bg-transparent p-6 font-mono text-sm leading-relaxed outline-none ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/20"
      />
    );
  }

  if (highlightedHtml) {
    return (
      <div
        className={cn(
          CODE_BLOCK_CLASS,
          '[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!border-0 [&_code]:!font-mono [&_code]:!text-sm [&_code]:!leading-relaxed',
        )}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  return (
    <pre className={CODE_BLOCK_CLASS}>
      <code className="font-mono">{script}</code>
    </pre>
  );
}
