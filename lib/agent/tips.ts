import 'server-only';

import type { AgentMessage, AgentToolResult } from '@/lib/types/agent';
import { GENERATE_ALERT_TEMPLATES_TOOL_NAME } from './tools/generate-alert-templates';
import { RUN_BACKTEST_SUMMARY_TOOL_NAME } from './tools/run-backtest-summary';
import { RUN_HEALTH_SCORE_TOOL_NAME } from './tools/run-health-score';

// Re-export the exact constants so callers (and the internal list) use a single source.
export const HEALTH_SCORE_TOOL = RUN_HEALTH_SCORE_TOOL_NAME;
export const BACKTEST_TOOL = RUN_BACKTEST_SUMMARY_TOOL_NAME;
export const ALERT_TEMPLATES_TOOL = GENERATE_ALERT_TEMPLATES_TOOL_NAME;

/** Display payload for a contextual tip. Stored in AgentMessage.tip. */
export interface ForgeTip {
  id: string;
  triggerTool: string;
  title: string;
  body: string;
  codeSnippet?: string;
  refineSuggestion?: string;
}

type ToolResultLike = {
  name: string;
  result: unknown;
};

/** Internal tip with matching predicate (lives only on server). */
type InternalTip = ForgeTip & {
  conditionFn: (results: ToolResultLike[]) => boolean;
};

/** Priority list; first match wins, at most one per turn. */
const FORGE_TIPS_INTERNAL: InternalTip[] = [
  {
    id: 'volume-filter',
    triggerTool: HEALTH_SCORE_TOOL,
    title: 'Add a volume filter',
    body: 'Many false signals in low-liquidity conditions come from ignoring volume. A simple guard like `volume > ta.sma(volume, 20)` can dramatically reduce whipsaws.',
    codeSnippet: 'volumeFilter = volume > ta.sma(volume, 20)',
    refineSuggestion: 'Add a volume confirmation filter: only take signals when volume > its 20-period SMA.',
    conditionFn: (results) => {
      const health = results.find((r) => r.name === HEALTH_SCORE_TOOL)?.result as
        | { risks?: unknown }
        | undefined;
      const risks = Array.isArray(health?.risks) ? health.risks.map(String) : [];
      return risks.some((r) => r.toLowerCase().includes('volume'));
    },
  },
  {
    id: 'atr-stop',
    triggerTool: HEALTH_SCORE_TOOL,
    title: 'Use ATR for dynamic stops',
    body: 'Fixed pip or percentage stops often get stopped out by normal volatility. ATR-based stops adapt to the instrument.',
    codeSnippet: 'atr = ta.atr(14)\nstop = close - (atr * 1.5)',
    refineSuggestion: 'Replace the fixed stop with an ATR-based stop (e.g. 1.5 × ATR(14)).',
    conditionFn: (results) => {
      const health = results.find((r) => r.name === HEALTH_SCORE_TOOL)?.result as
        | { risks?: unknown }
        | undefined;
      const risks = Array.isArray(health?.risks) ? health.risks.map(String) : [];
      return risks.some((r) => /atr|fixed stop|fixed pip/i.test(r));
    },
  },
  {
    id: 'secondary-confirmation',
    triggerTool: HEALTH_SCORE_TOOL,
    title: 'Add a secondary confirmation',
    body: 'Single-condition entries are fragile. A trend or momentum filter (higher-timeframe EMA, ADX, etc.) often improves the edge.',
    codeSnippet: 'trendFilter = close > ta.ema(close, 200)',
    refineSuggestion: 'Add a higher-timeframe or simple trend filter (e.g. close > EMA 200) before taking entries.',
    conditionFn: (results) => {
      const health = results.find((r) => r.name === HEALTH_SCORE_TOOL)?.result as
        | { risks?: unknown }
        | undefined;
      const risks = Array.isArray(health?.risks) ? health.risks.map(String) : [];
      return risks.some((r) => r.toLowerCase().includes('confirmation'));
    },
  },
  {
    id: 'low-score-refine',
    triggerTool: HEALTH_SCORE_TOOL,
    title: 'Refine this script',
    body: 'Scores below 5 usually indicate missing risk rules, vague exits, or too many conditions. One or two targeted refinements often lift the structure significantly.',
    refineSuggestion: 'Review the Health Score risks and apply the suggested fixes via a refine step.',
    conditionFn: (results) => {
      const health = results.find((r) => r.name === HEALTH_SCORE_TOOL)?.result as
        | { score?: unknown }
        | undefined;
      const score = typeof health?.score === 'number' ? health.score : 10;
      return score < 5;
    },
  },
  {
    id: 'choppiness-filter',
    triggerTool: BACKTEST_TOOL,
    title: 'Add a choppiness / regime filter',
    body: 'When the backtest summary flags "false signals" or ranging markets, strategies often benefit from a Choppiness Index or ADX filter that avoids entries in noisy conditions.',
    codeSnippet: 'choppy = ta.chop(14) < 38   // or ADX > 20 for trending',
    refineSuggestion: 'Add a market regime filter (Choppiness Index or ADX) to skip signals in choppy/ranging conditions.',
    conditionFn: (results) => {
      const bt = results.find((r) => r.name === BACKTEST_TOOL)?.result as
        | { sections?: Record<string, unknown>; failureModes?: unknown }
        | undefined;
      const text = JSON.stringify(bt?.sections ?? bt ?? {}).toLowerCase();
      return text.includes('false signal') || text.includes('chopp') || text.includes('range');
    },
  },
  {
    id: 'alert-setup',
    triggerTool: ALERT_TEMPLATES_TOOL,
    title: 'Connect alerts in TradingView',
    body: 'The generated webhook JSON is ready, but you still need to create the alert in TradingView, choose "Webhook URL", and paste the JSON into the message field.',
    refineSuggestion: 'Create the alert in TradingView now: right-click the script, Add Alert, set Webhook URL, and paste the exact messageJson from the template.',
    conditionFn: (results) => results.some((r) => r.name === ALERT_TEMPLATES_TOOL),
  },
];

/** Returns highest priority unseen tip matching tool results from this turn. */
export function evaluateTipsForTurn(
  toolResults: ReadonlyArray<AgentToolResult>,
  seenTips: ReadonlyArray<string> | undefined,
  conversationMessages: ReadonlyArray<AgentMessage>,
): ForgeTip | null {
  if (!toolResults || toolResults.length === 0) return null;

  const seen = new Set((seenTips ?? []).filter(Boolean));

  // Per-conversation guard: if this exact tip id already appears as a tip message
  // earlier in the thread, do not emit it again for this conversation.
  const alreadyInConversation = new Set<string>();
  for (const m of conversationMessages) {
    if (m.tip?.id) alreadyInConversation.add(m.tip.id);
  }

  // Normalise tool results to a shape the predicates expect
  const normalized: ToolResultLike[] = toolResults.map((r) => ({
    name: r.name,
    result: r.result,
  }));

  for (const tipDef of FORGE_TIPS_INTERNAL) {
    if (seen.has(tipDef.id)) continue;
    if (alreadyInConversation.has(tipDef.id)) continue;
    if (tipDef.conditionFn(normalized)) {
      // Return only the public payload (no conditionFn)
      return {
        id: tipDef.id,
        triggerTool: tipDef.triggerTool,
        title: tipDef.title,
        body: tipDef.body,
        codeSnippet: tipDef.codeSnippet,
        refineSuggestion: tipDef.refineSuggestion,
      };
    }
  }

  return null;
}

/** Extracts AgentToolResult[] from AI SDK Step-like results (for onFinish). */
export function extractToolResultsFromSteps(steps: readonly { toolResults?: readonly { toolName: string; output: unknown; toolCallId?: string }[] }[]): AgentToolResult[] {
  const out: AgentToolResult[] = [];
  for (const step of steps) {
    for (const tr of step.toolResults ?? []) {
      out.push({
        toolCallId: tr.toolCallId ?? '',
        name: tr.toolName,
        result: tr.output,
      });
    }
  }
  return out;
}
