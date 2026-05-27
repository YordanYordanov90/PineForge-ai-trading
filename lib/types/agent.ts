/**
 * Forge Agent type contracts (spec 52 — Forge Agent Memory Schema).
 *
 * Single source of truth for the agent's persistence shapes. Re-exported
 * from `lib/types/index.ts`. Mirrors the Vercel AI SDK's internal message
 * shape closely so serialization between the SDK and the DB is minimal.
 *
 * Scope of this file: types only. No Drizzle, no Zod, no AI SDK imports —
 * keeps the contract reusable from RSC, client components, and the DB
 * mappers without leaking heavy dependencies.
 */

export type AgentMessageRole = 'user' | 'assistant' | 'tool';

/**
 * Single turn in a Forge conversation. Stored as one element of the
 * `agent_conversations.messages` jsonb array.
 *
 * `toolCalls` and `toolResults` live on the message object (not separate
 * rows) because they are always rendered inline with the conversation.
 */
export interface AgentMessage {
  role: AgentMessageRole;
  content: string;
  toolCalls?: AgentToolCall[];
  toolResults?: AgentToolResult[];
  /** ISO timestamp (per-message, so the UI can show per-turn timing). */
  createdAt: string;
}

export interface AgentToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AgentToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  isError?: boolean;
}

/**
 * Long-term user profile extracted from conversations by spec 56.
 *
 * Every field is optional so a fresh profile is `{}` and the agent
 * gracefully handles the no-preferences case. `insights` is a bounded
 * free-text array (FIFO eviction at 10 entries) for observations the
 * extraction prompt captures that don't fit the structured fields.
 *
 * `averageHealthScore` and `totalStrategiesGenerated` are denormalized
 * from the scripts table for cheap injection into the system prompt
 * without re-querying the full script history.
 */
export interface AgentUserProfile {
  preferredMarkets?: string[];
  preferredTimeframes?: string[];
  preferredIndicators?: string[];
  riskTolerance?: string;
  strategyPatterns?: string[];
  averageHealthScore?: number;
  totalStrategiesGenerated?: number;
  insights?: string[];
  lastExtractedAt?: string;
}

/**
 * Client-facing shape for an `agent_conversations` row. Produced by
 * `rowToAgentConversation()` in `lib/db/agent-mapper.ts`. Spec 54's
 * CRUD routes return this; spec 57's UI consumes it for the chat
 * thread + conversation sidebar.
 */
export interface SavedConversation {
  id: number;
  title: string | null;
  messages: AgentMessage[];
  scriptId: number | null;
  /**
   * Conversation mode (spec 61). 'research' uses the research-optimised
   * system prompt and exposes the "Generate from Research" handoff flow.
   * All pre-61 conversations default to 'general'.
   */
  type: 'general' | 'research';
  createdAt: string;
  updatedAt: string;
}
