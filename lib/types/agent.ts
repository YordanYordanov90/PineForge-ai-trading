/**
 * Forge Agent type contracts for messages, profiles, conversations.
 * Persistence shapes + UI hydration. No SDK/Drizzle imports here.
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
  /** When present, renders as tip card instead of normal assistant bubble (spec 67). */
  tip?: {
    id: string;
    title: string;
    body: string;
    codeSnippet?: string;
    refineSuggestion?: string;
    triggerTool?: string;
  };
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
  /** Tip ids the user has already been shown. Prevents re-delivery globally. */
  seenTips?: string[];
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
  /** 'research' uses research-optimised prompt + handoff; older default to 'general'. */
  type: 'general' | 'research';
  createdAt: string;
  updatedAt: string;
}
