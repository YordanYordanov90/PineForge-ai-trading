import 'server-only';

import { xai } from '@ai-sdk/xai';
import { generateObject, streamText } from 'ai';
import { and, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import {
  db,
  rowToSavedScript,
  searchScriptsForUser,
} from '@/lib/db';
import {
  alertTemplatesLlmResultSchema,
  backtestSummaryLlmResultSchema,
  backtestSummaryResultSchema,
  healthScoreResultSchema,
  type AlertTemplatesResult,
  type BacktestSummaryResult,
  type HealthScoreResult,
} from '@/lib/api/validation';
import { normalizeAlertTemplatesOutput } from '@/lib/api/alert-templates-normalize';
import { HEALTH_SCORE_SYSTEM } from '@/lib/ai/prompts/health-score';
import { ALERT_TEMPLATES_SYSTEM } from '@/lib/ai/prompts/alert-templates';
import {
  BACKTEST_SUMMARY_SYSTEM,
  buildBacktestSummaryUserPrompt,
} from '@/lib/ai/prompts/backtest-summary';
import { assembleBacktestSummaryMarkdown } from '@/lib/ai/backtest-summary-markdown';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts/pine-generate-system';
import {
  ALERT_TEMPLATES_MAX_OUTPUT_TOKENS,
  BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS,
  HEALTH_SCORE_MAX_OUTPUT_TOKENS,
  REFINE_MAX_OUTPUT_TOKENS,
} from '@/lib/config/constants';
import type { GrokModelId, SavedScript } from '@/lib/types';
import type {
  GenerateAlertTemplatesInput,
  GetScriptDetailsInput,
  RefineScriptInput,
  RunBacktestSummaryInput,
  RunHealthScoreInput,
  SearchUserScriptsInput,
} from './tools';

/**
 * Forge Agent tool runners (spec 55).
 *
 * Each runner is the in-process equivalent of a `POST /api/<feature>`
 * handler — same schema, same system prompt, same model, same abort
 * signal forwarding — minus the HTTP / Zod-request layer which the
 * agent's tool layer handles via the spec-53 `inputSchema`. Keeping
 * the runners here (rather than re-using the route handlers) avoids
 * an internal HTTP round-trip and lets the agent inherit the parent
 * stream's `AbortSignal` directly.
 *
 * **Privacy invariant**: every runner is owner-scoped via the
 * `AgentToolContext.userId` passed in by spec 55's executor. The LLM
 * never supplies a user id and tools never accept one in their input
 * schema — see `lib/agent/tools/types.ts`.
 */

type RunnerContext = {
  userId: number;
  model: GrokModelId;
  signal: AbortSignal;
};

function buildScriptUserPrompt(prompt: string | undefined, script: string): string {
  const intent = prompt && prompt.trim().length > 0 ? prompt.trim() : '(prompt not provided)';
  return `Original strategy intent:
${intent}

Generated Pine Script v5:
\`\`\`pine
${script}
\`\`\`

Review the intent against the script. Score structural quality only.`;
}

function buildAlertTemplatesUserPrompt(
  prompt: string | undefined,
  script: string,
): string {
  const intent = prompt && prompt.trim().length > 0 ? prompt.trim() : '(prompt not provided)';
  return `Original strategy intent:
${intent}

Generated Pine Script v5:
\`\`\`pine
${script}
\`\`\`

Generate four webhook JSON alert message templates (3Commas, Alertatron, WunderTrading, Custom). Use placeholders for secrets and IDs. Templates are pasted into TradingView alert message fields only.`;
}

/**
 * `search_user_scripts` runner. Direct DB read via the same helper the
 * `/api/scripts/search` route uses (spec 42). No AI involvement.
 */
export async function runSearchUserScripts(
  input: SearchUserScriptsInput,
  ctx: Pick<RunnerContext, 'userId'>,
): Promise<{ scripts: SavedScript[]; count: number }> {
  const rows = await searchScriptsForUser(ctx.userId, {
    q: input.query,
    tags: input.tags,
    starred: input.starred,
    collectionId: input.collectionId,
  });
  const scriptsList = rows.map(rowToSavedScript);
  return { scripts: scriptsList, count: scriptsList.length };
}

/**
 * `get_script_details` runner. Owner-scoped via composite WHERE
 * (`scripts.id = ? AND scripts.user_id = ?`) so a foreign script and a
 * missing script are indistinguishable to the caller.
 */
export async function runGetScriptDetails(
  input: GetScriptDetailsInput,
  ctx: Pick<RunnerContext, 'userId'>,
): Promise<{ script: SavedScript } | null> {
  const [row] = await db
    .select()
    .from(scripts)
    .where(
      and(eq(scripts.id, input.scriptId), eq(scripts.userId, ctx.userId)),
    )
    .limit(1);

  if (!row) return null;
  return { script: rowToSavedScript(row) };
}

/**
 * `run_health_score` runner. Mirrors `/api/health-score` behaviour:
 * same system prompt, same loose schema → strict re-validate, same
 * temperature / token budget. Inherits the parent stream's abort
 * signal.
 */
export async function runHealthScoreInline(
  input: RunHealthScoreInput,
  ctx: RunnerContext,
): Promise<HealthScoreResult> {
  const userPrompt = buildScriptUserPrompt(input.prompt, input.script);

  const { object } = await generateObject({
    model: xai(ctx.model),
    schema: healthScoreResultSchema,
    system: HEALTH_SCORE_SYSTEM,
    prompt: userPrompt,
    temperature: 0.2,
    maxOutputTokens: HEALTH_SCORE_MAX_OUTPUT_TOKENS,
    abortSignal: ctx.signal,
  });

  const validated = healthScoreResultSchema.safeParse(object);
  if (!validated.success) {
    throw new Error('health-score validation failed');
  }
  return validated.data;
}

/**
 * `run_backtest_summary` runner. Mirrors `/api/backtesting-summary`:
 * loose intake schema → server-side `assembleBacktestSummaryMarkdown` →
 * strict re-validate. The agent's contract accepts free-text
 * `market` / `timeframe` (per spec 53); they're forwarded straight to
 * the prompt builder which already accepts free strings.
 */
export async function runBacktestSummaryInline(
  input: RunBacktestSummaryInput,
  ctx: RunnerContext,
): Promise<BacktestSummaryResult> {
  const intent = input.prompt && input.prompt.trim().length > 0
    ? input.prompt.trim()
    : 'User did not supply an intent description for this script.';

  const userPrompt = buildBacktestSummaryUserPrompt({
    prompt: intent,
    script: input.script,
    market: input.market ?? null,
    timeframe: input.timeframe ?? null,
  });

  const { object } = await generateObject({
    model: xai(ctx.model),
    schema: backtestSummaryLlmResultSchema,
    system: BACKTEST_SUMMARY_SYSTEM,
    prompt: userPrompt,
    temperature: 0.2,
    maxOutputTokens: BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS,
    abortSignal: ctx.signal,
  });

  const markdown = assembleBacktestSummaryMarkdown(object.sections);

  const validated = backtestSummaryResultSchema.safeParse({
    title: object.title,
    markdown,
    sections: object.sections,
  });
  if (!validated.success) {
    throw new Error('backtest-summary validation failed');
  }
  return validated.data;
}

/**
 * `generate_alert_templates` runner. Mirrors `/api/alert-templates`:
 * loose schema → `normalizeAlertTemplatesOutput()` (the same server-side
 * coercion the route uses) → strict shape with verified-parsable
 * `messageJson`.
 */
export async function runGenerateAlertTemplatesInline(
  input: GenerateAlertTemplatesInput,
  ctx: RunnerContext,
): Promise<AlertTemplatesResult> {
  const userPrompt = buildAlertTemplatesUserPrompt(input.prompt, input.script);

  const { object } = await generateObject({
    model: xai(ctx.model),
    schema: alertTemplatesLlmResultSchema,
    system: ALERT_TEMPLATES_SYSTEM,
    prompt: userPrompt,
    temperature: 0.2,
    maxOutputTokens: ALERT_TEMPLATES_MAX_OUTPUT_TOKENS,
    abortSignal: ctx.signal,
  });

  const normalized = normalizeAlertTemplatesOutput(object);
  if (!normalized) {
    throw new Error('alert-templates normalize failed');
  }
  return normalized;
}

/**
 * `refine_script` runner. The user-facing route streams; the agent
 * tool waits for completion and returns the full refined script as a
 * single string (per spec 53 — "tool waits for completion and returns
 * the final script"). System prompt + temperature + token budget all
 * mirror `POST /api/refine-script`.
 *
 * No concurrency lock here — the parent Forge stream already holds
 * `acquireStreamLock(userId)` for the entire conversation turn, so a
 * second lock attempt would deadlock.
 */
export async function runRefineScriptInline(
  input: RefineScriptInput,
  ctx: RunnerContext,
): Promise<{ script: string }> {
  const refineUserPrompt = `You are refining an existing Pine Script v5 script. Apply the user's instructions and return the complete updated script only (same output rules as a fresh generation).

Current script:
${input.script}

User instructions:
${input.instruction}`;

  const result = streamText({
    model: xai(ctx.model),
    system: PINE_GENERATE_SYSTEM_PROMPT,
    prompt: refineUserPrompt,
    temperature: 0.1,
    maxOutputTokens: REFINE_MAX_OUTPUT_TOKENS,
    abortSignal: ctx.signal,
  });

  const text = await result.text;
  // Spec 58 § Tool Result Validation #5: empty or whitespace-only output
  // is a refinement failure — throw so the spec-55 executor wrapper
  // returns the sanitized REFINE_SCRIPT_ERROR to the LLM.
  if (text.trim().length === 0) {
    throw new Error('refine-script returned empty content');
  }
  return { script: text };
}
