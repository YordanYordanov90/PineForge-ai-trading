type GenerateContextInput = {
  market?: string | null;
  timeframe?: string | null;
  direction?: string | null;
  indicators?: string[];
  rr?: string | null;
};

export function buildGenerateContextBlock(input: GenerateContextInput): string {
  const contextParts: string[] = [];
  if (input.market) contextParts.push(`Market: ${input.market}`);
  if (input.timeframe) contextParts.push(`Timeframe: ${input.timeframe}`);
  if (input.direction) contextParts.push(`Direction: ${input.direction}`);
  if (input.indicators?.length) {
    contextParts.push(`Preferred indicators: ${input.indicators.join(', ')}`);
  }
  if (input.rr) contextParts.push(`Risk-Reward ratio: ${input.rr}:1`);

  return contextParts.length
    ? `\n\nAdditional context: ${contextParts.join('; ')}`
    : '';
}