import type { agentConversations, agentMemory } from '@/drizzle/schema';
import type {
  AgentMessage,
  AgentUserProfile,
  SavedConversation,
} from '@/lib/types/agent';

type AgentConversationRow = typeof agentConversations.$inferSelect;
type AgentMemoryRow = typeof agentMemory.$inferSelect;

/**
 * Maps an `agent_conversations` DB row to the client-facing
 * {@link SavedConversation}. Spec 52 owns the shape; spec 54's CRUD
 * routes (list / get / save / delete) all funnel through this mapper
 * so every conversation response is structurally identical.
 *
 * `messages` is `notNull().default([])` at the schema layer, but the
 * coalesce keeps us safe against legacy rows or partial writes; same
 * for the two timestamps.
 */
export function rowToAgentConversation(
  row: AgentConversationRow,
): SavedConversation {
  return {
    id: row.id,
    title: row.title ?? null,
    messages: (row.messages ?? []) as AgentMessage[],
    scriptId: row.scriptId ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Summary row shape for `listConversationsForUser()` — explicitly omits
 * the heavy `messages` jsonb column so the list query stays cheap. The
 * mapper folds these into the full {@link SavedConversation} shape with
 * `messages: []` so consumers can rely on one canonical client type;
 * the empty array signals "messages not loaded for this view" rather
 * than "this conversation has no messages".
 */
export type AgentConversationSummaryRow = {
  id: number;
  title: string | null;
  scriptId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

/**
 * Maps a summary row (no `messages`) to the client-facing
 * {@link SavedConversation}. The `messages` field is always `[]` — the
 * detail endpoint (`GET /api/forge/conversations/[id]`) is the only
 * route that materializes the full thread.
 */
export function rowToAgentConversationSummary(
  row: AgentConversationSummaryRow,
): SavedConversation {
  return {
    id: row.id,
    title: row.title ?? null,
    messages: [],
    scriptId: row.scriptId ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Maps an `agent_memory` DB row to the client-facing
 * {@link AgentUserProfile}. Returns the structured profile only; the
 * `id`, `userId`, and `updatedAt` columns are intentionally not surfaced
 * because spec 55 (streaming endpoint) injects the profile into the
 * system prompt and spec 57 (UI) never displays a "memory row" — only
 * the profile fields.
 *
 * `profile` is `notNull().default({})` at the schema layer; the
 * coalesce keeps the contract safe against any legacy / partially
 * written row.
 */
export function rowToAgentMemory(row: AgentMemoryRow): AgentUserProfile {
  return (row.profile ?? {}) as AgentUserProfile;
}
