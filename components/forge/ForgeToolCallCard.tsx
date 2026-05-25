'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  FlaskConical,
  Globe,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import {
  FORGE_TOOL_LABELS,
  prettifyForgeToolName,
} from '@/lib/forge/tool-labels';
import { cn } from '@/lib/utils';

type ForgeToolCallState =
  | 'loading'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

type ForgeToolCallCardProps = {
  toolName: string;
  state: ForgeToolCallState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const TOOL_ICONS: Record<string, LucideIcon> = {
  search_user_scripts: Search,
  get_script_details: Search,
  run_health_score: ShieldCheck,
  run_backtest_summary: FlaskConical,
  generate_alert_templates: Bell,
  refine_script: Pencil,
  search_strategy_knowledge: Globe,
};

export function ForgeToolCallCard({
  toolName,
  state,
  input,
  output,
  errorText,
}: ForgeToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const wasLoadingRef = useRef(state === 'loading');

  const label = FORGE_TOOL_LABELS[toolName] ?? prettifyForgeToolName(toolName);
  const Icon = TOOL_ICONS[toolName] ?? Wrench;
  const summary = buildSummary(toolName, state, output, errorText);
  const isLoading = state === 'loading';
  const isError = state === 'output-error';
  const canExpand = state === 'output-available' && output !== undefined;

  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds((Date.now() - startedAt) / 1000);
    }, 100);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (wasLoadingRef.current && state === 'output-available') {
      setJustCompleted(true);
      const timeout = window.setTimeout(() => setJustCompleted(false), 600);
      return () => window.clearTimeout(timeout);
    }
    wasLoadingRef.current = isLoading;
    return undefined;
  }, [isLoading, state]);

  return (
    <div
      className={cn(
        'forge-fade-up relative my-3 overflow-hidden rounded-xl border bg-zinc-50/70 px-3 py-2 text-sm shadow-sm',
        isError
          ? 'border-amber-500/40 bg-amber-500/[0.07] dark:bg-amber-500/[0.08]'
          : 'border-zinc-200/80 dark:border-zinc-800/70 dark:bg-zinc-900/50',
        justCompleted && 'forge-tool-complete-flash',
      )}
      role="region"
      aria-label={`Tool call: ${label}`}
    >
      {isLoading ? (
        <div aria-hidden className="forge-tool-progress absolute inset-x-0 top-0 h-0.5" />
      ) : null}

      <button
        type="button"
        onClick={() => canExpand && setExpanded((open) => !open)}
        aria-expanded={canExpand ? expanded : undefined}
        aria-label={`${label} — ${summary}`}
        disabled={!canExpand}
        className={cn(
          'flex w-full items-center gap-2.5 text-left',
          canExpand && 'cursor-pointer',
          !canExpand && 'cursor-default',
        )}
      >
        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-lg border',
            isError
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-500 dark:text-amber-400'
              : isLoading
                ? 'border-neon-500/30 bg-neon-500/15 text-neon-500 dark:text-neon-400'
                : 'border-neon-500/25 bg-neon-500/10 text-neon-500 dark:text-neon-400',
          )}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : isError ? (
            <AlertTriangle className="size-3.5" aria-hidden />
          ) : (
            <Icon className="size-3.5" aria-hidden />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-medium tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
            {label}
          </span>
          <span className="pf-muted truncate text-xs leading-snug">
            {summary}
          </span>
        </span>

        {isLoading ? (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-neon-600 dark:text-neon-400">
            {elapsedSeconds.toFixed(1)}s
          </span>
        ) : null}

        {canExpand ? (
          <ChevronRight
            className={cn(
              'pf-muted size-4 shrink-0 transition-transform',
              expanded && 'rotate-90',
            )}
            aria-hidden
          />
        ) : null}
      </button>

      {expanded && canExpand ? (
        <div className="mt-3 space-y-2 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
          {input !== undefined ? (
            <ToolPayloadBlock label="Input" payload={input} />
          ) : null}
          <ToolPayloadBlock label="Output" payload={output} />
        </div>
      ) : null}
    </div>
  );
}

type ToolPayloadBlockProps = {
  label: string;
  payload: unknown;
};

function ToolPayloadBlock({ label, payload }: ToolPayloadBlockProps) {
  return (
    <details className="rounded-lg bg-zinc-100/70 px-3 py-2 dark:bg-zinc-950/40">
      <summary className="pf-muted cursor-pointer text-xs font-medium uppercase tracking-wide">
        {label}
      </summary>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        {safeJson(payload)}
      </pre>
    </details>
  );
}

function safeJson(payload: unknown): string {
  if (payload === undefined) return 'undefined';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function buildSummary(
  toolName: string,
  state: ForgeToolCallState,
  output: unknown,
  errorText?: string,
): string {
  const label = FORGE_TOOL_LABELS[toolName] ?? prettifyForgeToolName(toolName);

  if (state === 'loading') return `Running ${label}…`;
  if (state === 'output-error') return errorText ?? 'Tool error.';
  if (state === 'output-denied') return 'Tool execution denied.';

  if (!output || typeof output !== 'object') return 'Completed.';
  const data = output as Record<string, unknown>;

  if (typeof data.error === 'string') return data.error;
  if (typeof data.unavailable === 'string') return data.unavailable;

  switch (toolName) {
    case 'search_user_scripts': {
      const count =
        typeof data.count === 'number'
          ? data.count
          : Array.isArray(data.scripts)
            ? data.scripts.length
            : 0;
      return count === 0
        ? 'No matching scripts found.'
        : `Found ${count} ${count === 1 ? 'script' : 'scripts'}.`;
    }
    case 'get_script_details': {
      const script = data.script as { name?: string } | undefined;
      return script?.name ? `Loaded "${script.name}"` : 'Loaded script details.';
    }
    case 'run_health_score': {
      const score = data.score;
      const verdict = typeof data.verdict === 'string' ? data.verdict : null;
      if (typeof score === 'number') {
        return verdict ? `Score: ${score}/10 — ${verdict}` : `Score: ${score}/10`;
      }
      return 'Health score ready.';
    }
    case 'run_backtest_summary': {
      const title = typeof data.title === 'string' ? data.title : null;
      return title ? `Backtest plan: ${title}` : 'Backtest plan ready.';
    }
    case 'generate_alert_templates': {
      const templates = Array.isArray(data.templates) ? data.templates : [];
      return `Generated ${templates.length} alert templates.`;
    }
    case 'refine_script': {
      const script = typeof data.script === 'string' ? data.script : '';
      const chars = script.length;
      return chars > 0 ? `Refined script (${chars} chars).` : 'Refined script.';
    }
    case 'search_strategy_knowledge': {
      const results = Array.isArray(data.results) ? data.results : [];
      return results.length === 0
        ? 'No research results.'
        : `${results.length} research ${results.length === 1 ? 'result' : 'results'}.`;
    }
    default:
      return 'Completed.';
  }
}
