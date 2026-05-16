'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, MousePointerClick } from 'lucide-react';
import { highlightPineScript } from '@/lib/ai/highlight';

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
};

export function ScriptOutput({
  script,
  isGenerating,
  isStreaming,
  isIdle,
  onScriptChange,
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
      <div className="relative flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/50">
          <Terminal className="h-7 w-7 text-zinc-600" />
        </div>
        <p className="text-base font-medium text-zinc-300">Your Pine Script will appear here</p>
        <p className="mt-1.5 text-sm text-zinc-500">Describe your strategy and click Generate to get started.</p>
        <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-zinc-600">
          <MousePointerClick className="h-3 w-3" />
          Fill in the inputs on the left
        </div>
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
      <pre className="relative max-h-[640px] overflow-auto p-6 text-sm leading-relaxed text-emerald-300/95">
        <code className="font-mono">
          {script}
          <span className="animate-blink-cursor ml-0.5 inline-block h-4 w-2 bg-emerald-400 align-text-bottom" />
        </code>
      </pre>
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
        className="box-border max-h-[640px] min-h-[320px] w-full resize-y border-0 bg-transparent p-6 font-mono text-sm leading-relaxed text-emerald-300/95 outline-none ring-0 focus-visible:outline-none"
      />
    );
  }

  if (highlightedHtml) {
    return (
      <div
        className="max-h-[640px] overflow-auto p-6 text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_pre]:!border-0 [&_code]:!font-mono [&_code]:!text-sm [&_code]:!leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  return (
    <pre className="relative max-h-[640px] overflow-auto p-6 text-sm leading-relaxed text-emerald-300/95">
      <code className="font-mono">{script}</code>
    </pre>
  );
}