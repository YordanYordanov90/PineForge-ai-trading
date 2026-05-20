export type PromptSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

/** Static starters for the Script output empty state (not AI-generated). */
export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'momentum-hod',
    label: '5m HOD breakout',
    prompt:
      '5-minute momentum breakout for stocks. Enter long on a break above the high of day with RVOL > 2. Only trade names up more than 2% pre-market. Stop below the last higher low; take profit at 2R and trail after 1R. Include Getting Ready, Average, and Strong alert tiers.',
  },
  {
    id: 'rsi-reversal',
    label: 'RSI divergence reversal',
    prompt:
      '15-minute RSI(14) bullish divergence: price lower low, RSI higher low. Confirm with a bullish engulfing candle and rising volume on the reversal. Stop under the swing low; target prior resistance or 3R. Tiered alerts for forming, confirmed, and high-conviction setups.',
  },
  {
    id: 'vwap-scalp',
    label: 'VWAP bounce scalper',
    prompt:
      '1-minute VWAP bounce scalper. Long when price pulls back to VWAP from above and prints a hammer or bullish rejection. Volume fades on the dip and expands on the bounce. Stop 0.5R below VWAP; exit at 1R. Only trade with the trend (price above VWAP). Three alert tiers.',
  },
  {
    id: 'opening-range',
    label: 'Opening range breakout',
    prompt:
      '5-minute opening range breakout: range = first 15 minutes high/low. Long above range high, short below range low, both with volume ≥ 1.5× 20-bar average. Stop outside the range; target 2R or ATR-based. Getting Ready, Average, and Strong alert tiers.',
  },
];
