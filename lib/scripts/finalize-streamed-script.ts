import {
  parseAssumptionsBlock,
  type StrategyAssumptions,
} from '@/lib/ai/parse-assumptions';

export function finalizeStreamedScript(raw: string): {
  cleanScript: string;
  assumptions: StrategyAssumptions | null;
} {
  const parsed = parseAssumptionsBlock(raw);
  return {
    cleanScript: parsed.cleanScript || raw.trim(),
    assumptions: parsed.assumptions ?? null,
  };
}