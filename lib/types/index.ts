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
};

export type GenerationStats = {
  durationMs: number;
  estimatedTokens: number;
};
