import type { GrokModelId, SavedScript } from '@/lib/types';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';

export function buildSavedScriptFromGeneration(params: {
  prompt: string;
  balance: string;
  script: string;
  model: GrokModelId;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
  assumptions?: StrategyAssumptions | null;
  variantAxis?: 'risk-tight' | 'signal-quality' | 'indicator-swap';
}): SavedScript {
  const trim = params.prompt.trim();
  const base = trim.length <= 40 ? trim : `${trim.slice(0, 40)}…`;
  return {
    id: crypto.randomUUID(),
    name: base || 'Untitled strategy',
    prompt: params.prompt,
    balance: params.balance,
    script: params.script,
    createdAt: new Date().toISOString(),
    version: 1,
    model: params.model,
    market: params.market,
    timeframe: params.timeframe,
    direction: params.direction,
    indicators: params.indicators,
    rr: params.rr,
    isStarred: false,
    tags: [],
    collectionId: null,
    assumptions: params.assumptions ?? null,
    variantAxis: params.variantAxis,
    healthScore: null,
  };
}

export function buildSavedScriptFromRefinement(params: {
  name: string;
  prompt: string;
  balance: string;
  script: string;
  model: GrokModelId;
  version: number;
  parentId: string;
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
  assumptions?: StrategyAssumptions | null;
  variantAxis?: 'risk-tight' | 'signal-quality' | 'indicator-swap';
}): SavedScript {
  return {
    id: crypto.randomUUID(),
    name: params.name.trim() || 'Untitled strategy',
    prompt: params.prompt,
    balance: params.balance,
    script: params.script,
    createdAt: new Date().toISOString(),
    version: params.version,
    parentId: params.parentId,
    model: params.model,
    market: params.market,
    timeframe: params.timeframe,
    direction: params.direction,
    indicators: params.indicators,
    rr: params.rr,
    isStarred: false,
    tags: [],
    collectionId: null,
    assumptions: params.assumptions ?? null,
    variantAxis: params.variantAxis,
    healthScore: null,
  };
}
