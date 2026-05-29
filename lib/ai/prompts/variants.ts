import type { StructuredInputsValue } from '@/components/strategy/StructuredInputs';

export type VariantAxis = 'risk-tight' | 'signal-quality' | 'indicator-swap';

export interface VariantDefinition {
  axis: VariantAxis;
  label: string;
  modifier: string;
}

export const VARIANT_DEFINITIONS: Record<VariantAxis, VariantDefinition> = {
  'risk-tight': {
    axis: 'risk-tight',
    label: 'Tighter Risk',
    modifier: `VARIANT MODIFIER: Adjust this strategy for tighter risk management.
Reduce all stop-loss distances by approximately 40%. Use faster-period
versions of any moving averages (reduce all periods by 30%). Keep the
core entry logic identical.`,
  },
  'signal-quality': {
    axis: 'signal-quality',
    label: 'Higher Quality Signals',
    modifier: `VARIANT MODIFIER: Adjust this strategy for higher signal quality with
fewer, more reliable entries. Widen stop-loss distances by approximately
50%. Add a secondary confirmation filter (volume spike, trend filter, or
longer-period MA) to reduce false signals. Keep the core entry logic identical.`,
  },
  'indicator-swap': {
    axis: 'indicator-swap',
    label: 'Indicator Swap',
    modifier: `VARIANT MODIFIER: Replace the primary momentum/trend indicator with a
comparable alternative. If using EMA/SMA → use VWAP or Hull MA instead.
If using RSI → use Stochastic RSI instead. If using MACD → use CCI or
Williams %R instead. Keep the same logical structure; only swap the
indicator family.`,
  },
};

export const VARIANT_AXES: VariantAxis[] = ['risk-tight', 'signal-quality', 'indicator-swap'];

/**
 * Builds the user prompt for a variant generation call.
 * Mirrors the structure used by /api/generate but appends the axis-specific modifier.
 * The returned prompt is also stored in the variant response for lineage/debug.
 */
export function buildVariantUserPrompt(params: {
  prompt: string;
  /** Original Pine Script output — variants must tune this script, not re-invent from description alone. */
  script: string;
  balance: string | null;
  structuredInputs: StructuredInputsValue;
  modifier: string;
}): string {
  const { prompt, script, balance, structuredInputs, modifier } = params;

  const contextParts: string[] = [];
  if (structuredInputs.market) contextParts.push(`Market: ${structuredInputs.market}`);
  if (structuredInputs.timeframe) contextParts.push(`Timeframe: ${structuredInputs.timeframe}`);
  if (structuredInputs.direction) contextParts.push(`Direction: ${structuredInputs.direction}`);
  if (structuredInputs.indicators?.length) {
    contextParts.push(`Preferred indicators: ${structuredInputs.indicators.join(', ')}`);
  }
  if (structuredInputs.rr) contextParts.push(`Risk-Reward ratio: ${structuredInputs.rr}:1`);

  const contextBlock = contextParts.length
    ? `\n\nAdditional context: ${contextParts.join('; ')}`
    : '';

  const balanceLine = balance ? `\nAccount balance: ${balance}` : '';

  const trimmedScript = script.trim();
  const scriptBlock = trimmedScript
    ? `\n\nCurrent Pine Script (modify this implementation — keep core entry logic unless the modifier says otherwise):\n\`\`\`pine\n${trimmedScript}\n\`\`\``
    : '';

  return `Strategy description: ${prompt}${balanceLine}${contextBlock}${scriptBlock}\n\n${modifier}`;
}
