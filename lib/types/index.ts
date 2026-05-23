import type { GrokModel } from '@/lib/config/constants';

export type GrokModelId = GrokModel['id'];

export type SavedScript = {
  id: string;
  name: string;
  prompt: string;
  balance: string;
  script: string;
  createdAt: string;
  version: number;
  parentId?: string;
  model?: GrokModelId;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
  /**
   * Canonical pinned/starred flag. Persisted column: `scripts.is_starred`.
   * Always exposed as a boolean to clients (defaults to `false` for legacy
   * entries that predate Phase 5 starred scripts). Toggled via the dedicated
   * `PATCH /api/scripts/[scriptId]/star` route (spec 37).
   */
  isStarred: boolean;
  /**
   * Canonical user-defined tag list. Persisted column: `scripts.tags`
   * (jsonb `string[]`, default `[]`). Always exposed as a normalized
   * lower-cased array (defaults to `[]` for legacy entries that predate
   * Phase 5 tags). Normalization + length rules live in
   * `lib/scripts/tags.ts`; mutations land via the dedicated route in
   * spec 41 (`PATCH /api/scripts/[scriptId]/tags`).
   */
  tags: string[];
  /**
   * Optional foreign key to the user's collection. Persisted column:
   * `scripts.collection_id` (`integer references collections(id)`,
   * nullable). Always exposed as `number | null` (defaults to `null` for
   * legacy entries that predate Phase 5 collections). Naming rules live in
   * `lib/collections/collections.ts`; assignment lands via the dedicated
   * route in spec 46 (`PATCH /api/scripts/[scriptId]/collection`).
   */
  collectionId: number | null;
};

/**
 * Canonical client model for a strategy collection (folder). Persisted in
 * the `collections` table. Names are per-user, trimmed, and de-duplicated
 * at the app layer (no DB unique index yet — see
 * `lib/collections/collections.ts`). Spec 45's CRUD route returns this
 * shape; spec 47's UI consumes it for the collection picker.
 */
export type SavedCollection = {
  id: number;
  name: string;
  createdAt: string;
};

export type GenerationStats = {
  durationMs: number;
  estimatedTokens: number;
};

/**
 * Forge Agent contracts (spec 52). Re-exported here so consumers can keep
 * importing from `@/lib/types` without reaching into `@/lib/types/agent`.
 */
export type {
  AgentMessage,
  AgentMessageRole,
  AgentToolCall,
  AgentToolResult,
  AgentUserProfile,
  SavedConversation,
} from './agent';
