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
};

export type GenerationStats = {
  durationMs: number;
  estimatedTokens: number;
};
