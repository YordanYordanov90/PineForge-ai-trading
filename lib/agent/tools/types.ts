/**
 * Shared types for Forge Agent tool contracts (spec 53).
 *
 * Every tool contract file in this directory imports {@link AgentToolContext}
 * and {@link AgentToolExecutor} so spec 55's streaming endpoint can wire
 * `execute` functions against one canonical signature. Tools never accept
 * the auth context as part of their LLM-facing input — those fields live
 * here and are passed in by the endpoint at call time.
 *
 * Scope: types only. No Zod, no Drizzle, no AI SDK imports — keeps the
 * contracts importable from anywhere without dragging heavy deps along.
 */

import type { GrokModelId } from '@/lib/types';
import type { UserPlan } from '@/lib/api/protected-ai-route';

/**
 * Per-invocation context provided by spec 55's streaming endpoint. Every
 * tool execute function receives this exact shape. None of these fields
 * are ever exposed to the LLM — they live outside the input schema.
 */
export type AgentToolContext = {
  /**
   * The authenticated DB user id (integer, from `users.id`). Tools scope
   * every query to this user so cross-user reads are structurally
   * impossible.
   */
  userId: number;
  /**
   * The caller's Clerk user id — used by helpers like
   * `ensureDbUserForClerkId` or for rate-limit bucket keys.
   */
  clerkId: string;
  /**
   * The caller's plan tier. Tools that wrap AI endpoints feed this into
   * `resolveModelForPlan()` so the agent inherits the same model
   * entitlement rules as the manual `/generate` flows.
   */
  plan: UserPlan;
  /**
   * The Grok model the agent is currently running on. Tools that wrap AI
   * endpoints reuse this for sub-calls so a Pro user's agent doesn't
   * silently drop to the free-tier model mid-conversation.
   */
  model: GrokModelId;
  /**
   * Abort signal from the parent streaming request. Every tool that makes
   * an LLM call must forward this to `generateObject` / `streamText` so
   * client disconnects cancel in-flight work immediately.
   */
  signal: AbortSignal;
};

/**
 * Canonical signature for every Forge tool's executor. Spec 55 implements
 * one of these per tool and feeds them into the AI SDK's `tool()` helper.
 *
 * Returning a typed Output (not `unknown`) is intentional — it forces
 * each tool's serialized result to be auditable up-front so spec 58's
 * guardrails can reason about what reaches the LLM and the user.
 */
export type AgentToolExecutor<Input, Output> = (
  input: Input,
  ctx: AgentToolContext,
) => Promise<Output>;

/**
 * Read-only contract shape that each tool file exports. Spec 55's
 * streaming endpoint composes one of these with an executor into the
 * AI SDK's `tool({ description, inputSchema, execute })` call.
 *
 * `errorMessage` is the sanitized fallback string each tool returns to
 * the LLM (and indirectly the user) when its executor throws — keeps
 * stack traces and internal details out of the conversation per spec
 * § Design Principles → "Sanitized results".
 */
export type AgentToolContract<Input, Output> = {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: import('zod').ZodType<Input>;
  readonly errorMessage: string;
  /**
   * Phantom type slot so consumers of the contract can infer the
   * executor's return type without re-importing the per-tool `Output`
   * alias. The value is always `undefined` at runtime.
   */
  readonly __output?: Output;
};
