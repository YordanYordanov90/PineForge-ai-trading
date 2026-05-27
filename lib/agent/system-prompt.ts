import 'server-only';

import type { AgentUserProfile } from '@/lib/types/agent';
import { FORGE_GUARDRAILS } from './guardrails';
import { FORGE_RESEARCH_IDENTITY } from '@/lib/ai/prompts/forge-research';

/**
 * Forge Agent system prompt builder (spec 55 § "System Prompt").
 *
 * The full prompt is composed of four optional sections in a fixed order:
 *   1. Identity & Scope (always)
 *   2. Long-Term Memory (when {@link AgentUserProfile} is non-empty)
 *   3. Active Script Context (when the conversation was seeded with a
 *      `scriptId` via `/forge?scriptId=<id>`)
 *   4. Guardrails (always — sourced from `./guardrails` per spec 58)
 *
 * The canonical {@link FORGE_GUARDRAILS} block lives in `./guardrails.ts`
 * (spec 58) so refusal patterns, language constraints, and tool-usage
 * rules have a single source of truth across the agent stack. This
 * builder is intentionally policy-free — it composes sections in a
 * stable order so the LLM caches the prompt prefix consistently across
 * turns.
 */

const FORGE_IDENTITY = `You are Forge, PineForge's strategy workflow assistant. You help traders build, analyze, and organize Pine Script v5 strategies.

You have access to tools that can search the user's script history, run Health Score analysis, generate backtesting plans, create alert templates, refine scripts, and research trading strategies.

You are NOT a trading advisor. You do not give buy/sell recommendations, predict prices, or provide financial advice.`;

/**
 * When the conversation was started from `/forge?scriptId=<id>` we
 * truncate the script body to keep the system prompt under control.
 * The agent always has `get_script_details` available if it needs the
 * full body, so the truncation here only affects the seeded context
 * block — not what tools can read.
 */
const SCRIPT_CONTEXT_BUDGET = 2000;

export interface ForgeScriptContext {
  /** `scripts.title` (or "Untitled strategy" fallback). */
  title: string;
  /** Original strategy description from `metadata.prompt`. May be empty. */
  prompt: string;
  /** Pine Script content. Truncated to {@link SCRIPT_CONTEXT_BUDGET} chars. */
  script: string;
  /** Already-normalized tag list (lower-cased, deduped). */
  tags?: string[];
  /** Last Health Score (1–10), if previously run. */
  healthScore?: number | null;
}

function profileSection(profile: AgentUserProfile): string {
  const lines: string[] = [];

  if (profile.preferredMarkets?.length) {
    lines.push(`- Preferred markets: ${profile.preferredMarkets.join(', ')}`);
  }
  if (profile.preferredTimeframes?.length) {
    lines.push(
      `- Preferred timeframes: ${profile.preferredTimeframes.join(', ')}`,
    );
  }
  if (profile.preferredIndicators?.length) {
    lines.push(
      `- Preferred indicators: ${profile.preferredIndicators.join(', ')}`,
    );
  }
  if (profile.riskTolerance) {
    lines.push(`- Risk tolerance: ${profile.riskTolerance}`);
  }
  if (profile.strategyPatterns?.length) {
    lines.push(
      `- Strategy patterns: ${profile.strategyPatterns.join(', ')}`,
    );
  }
  if (
    profile.averageHealthScore != null &&
    profile.totalStrategiesGenerated != null
  ) {
    lines.push(
      `- Average Health Score: ${profile.averageHealthScore.toFixed(1)} (across ${profile.totalStrategiesGenerated} strategies)`,
    );
  } else if (profile.averageHealthScore != null) {
    lines.push(
      `- Average Health Score: ${profile.averageHealthScore.toFixed(1)}`,
    );
  } else if (profile.totalStrategiesGenerated != null) {
    lines.push(
      `- Strategies generated: ${profile.totalStrategiesGenerated}`,
    );
  }
  if (profile.insights?.length) {
    lines.push(`- Notes: ${profile.insights.join(' ')}`);
  }

  if (lines.length === 0) return '';

  return `## What You Know About This User\n\n${lines.join('\n')}`;
}

function scriptContextSection(ctx: ForgeScriptContext): string {
  const truncated =
    ctx.script.length > SCRIPT_CONTEXT_BUDGET
      ? `${ctx.script.slice(0, SCRIPT_CONTEXT_BUDGET)}\n... (truncated)`
      : ctx.script;

  const lines: string[] = [];
  lines.push(`Title: ${ctx.title}`);
  if (ctx.prompt && ctx.prompt.trim().length > 0) {
    lines.push(`Prompt: "${ctx.prompt.trim()}"`);
  }
  if (ctx.tags && ctx.tags.length > 0) {
    lines.push(`Tags: ${ctx.tags.join(', ')}`);
  }
  if (ctx.healthScore != null) {
    lines.push(`Health Score: ${ctx.healthScore}/10`);
  }
  lines.push(`Script:\n\`\`\`pine\n${truncated}\n\`\`\``);

  return `## Active Script Context\n\n${lines.join('\n')}`;
}

/**
 * Composes the Forge system prompt for a single streaming turn.
 *
 * Pure & deterministic — no DB reads, no env access. Callers (the spec
 * 55 streaming endpoint) are responsible for loading the profile,
 * optional script context, and conversation type. Stable section order
 * so the LLM caches the prompt prefix consistently across turns.
 *
 * When `conversationType === 'research'` the research-optimised identity
 * (spec 61) is used instead of the default workflow identity. The full
 * guardrail block is always appended last.
 */
export function buildForgeSystemPrompt(
  profile: AgentUserProfile,
  scriptContext?: ForgeScriptContext,
  conversationType: 'general' | 'research' = 'general',
): string {
  const identity =
    conversationType === 'research'
      ? FORGE_RESEARCH_IDENTITY
      : FORGE_IDENTITY;

  const sections: string[] = [identity];

  const profileText = profileSection(profile);
  if (profileText) sections.push(profileText);

  if (scriptContext) sections.push(scriptContextSection(scriptContext));

  sections.push(FORGE_GUARDRAILS);

  return sections.join('\n\n');
}
