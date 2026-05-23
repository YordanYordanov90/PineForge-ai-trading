'use client';

import { useEffect, useState } from 'react';
import { ScriptOutputEditable } from '@/components/strategy/ScriptOutputEditable';
import { ScriptOutputHighlighted } from '@/components/strategy/ScriptOutputHighlighted';
import { ScriptOutputIdle } from '@/components/strategy/ScriptOutputIdle';
import { ScriptOutputPlain } from '@/components/strategy/ScriptOutputPlain';
import { ScriptOutputSkeleton } from '@/components/strategy/ScriptOutputSkeleton';
import { ScriptOutputStreaming } from '@/components/strategy/ScriptOutputStreaming';

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
    (async () => {
      const mod = await import('@/lib/ai/highlight');
      if (cancelled) return;
      const html = await mod.highlightPineScript(script);
      if (!cancelled) setHighlightedHtml(html);
    })();
    return () => {
      cancelled = true;
    };
  }, [onScriptChange, isGenerating, script]);

  if (isIdle) {
    return <ScriptOutputIdle onSuggestionClick={onSuggestionClick} />;
  }

  if (isGenerating && !script) {
    return <ScriptOutputSkeleton />;
  }

  if (isStreaming) {
    return <ScriptOutputStreaming script={script} />;
  }

  const settledEditable = Boolean(
    onScriptChange && !isGenerating && !isStreaming && !isIdle,
  );

  if (settledEditable && onScriptChange) {
    return <ScriptOutputEditable script={script} onScriptChange={onScriptChange} />;
  }

  if (highlightedHtml) {
    return <ScriptOutputHighlighted highlightedHtml={highlightedHtml} />;
  }

  return <ScriptOutputPlain script={script} />;
}
