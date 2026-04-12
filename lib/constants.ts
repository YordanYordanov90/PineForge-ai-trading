export const MAX_PROMPT_LENGTH = 1500;

export type GrokModel = {
  id: 'grok-4-1-fast-reasoning' | 'grok-4-1-fast-non-reasoning' | 'grok-4';
  label: string;
  description: string;
};

export const GROK_MODELS: GrokModel[] = [
  {
    id: 'grok-4-1-fast-reasoning',
    label: 'Reasoning',
    description: 'Best quality, slower',
  },
  {
    id: 'grok-4-1-fast-non-reasoning',
    label: 'Fast',
    description: 'Quick responses',
  },
  {
    id: 'grok-4',
    label: 'Grok-4',
    description: 'Most capable',
  },
] as const;

export const DEFAULT_MODEL = 'grok-4-1-fast-reasoning' as const;

export const MAX_HISTORY_ENTRIES = 50;

export const CHAR_WARNING_THRESHOLD = 1200;

export const CHAR_DANGER_THRESHOLD = 1400;

export type StrategyPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'momentum-5m',
    label: '5m Momentum Breakout',
    prompt:
      '5-minute momentum breakout strategy for stocks. Entry: price breaks above the high of the day (HOD) with relative volume (RVOL) greater than 2. Only trade stocks where pre-market gain exceeds 2%. Confirm with a pullback to the breakout level showing support. Stop-loss below the last higher low. Take profit at 2R with a trailing stop activated after 1R profit. Include three alert tiers: Getting Ready (approaching HOD with rising RVOL), Average (HOD break confirmed with volume), Strong (HOD break + volume + sector momentum). Use account balance for position sizing with 1% risk per trade.',
  },
  {
    id: 'rsi-divergence',
    label: 'RSI Divergence Reversal',
    prompt:
      'RSI divergence reversal strategy on 15-minute chart. Look for bullish RSI divergence where price makes a lower low but RSI(14) makes a higher low. Confirm entry with a bullish engulfing candlestick pattern at the divergence point. Volume should be declining on the sell-off and increasing on the reversal candle. Stop-loss below the swing low. Take profit at the previous resistance level or 3R, whichever comes first. Include three alert tiers: Getting Ready (RSI divergence forming), Average (divergence confirmed + engulfing candle), Strong (divergence + engulfing + volume spike). Risk 1% of account balance per trade.',
  },
  {
    id: 'vwap-bounce',
    label: 'VWAP Bounce Scalper',
    prompt:
      'VWAP bounce scalper for stocks on 1-minute chart. Buy when price pulls back to VWAP from above and bounces with a hammer or bullish candle formation. Volume should be declining during the pullback and pick up on the bounce. Enter on the close of the bounce candle. Stop-loss 0.5R below VWAP. Take profit at 1R above entry for quick scalps. Only take trades in the direction of the trend (price above VWAP for longs). Include three alert tiers: Getting Ready (price approaching VWAP), Average (VWAP bounce candle forming), Strong (VWAP bounce + volume confirmation + trend alignment). Position size from account balance, 0.5% risk per trade.',
  },
  {
    id: 'opening-range',
    label: 'Opening Range Breakout',
    prompt:
      'Opening range breakout strategy on 5-minute chart. Define the opening range as the high and low of the first 15 minutes of trading (first three 5-minute candles). Enter long when price breaks above the range high with volume at least 1.5x the 20-period average. Enter short when price breaks below the range low with similar volume confirmation. Stop-loss below the range low for longs, above range high for shorts. Take profit at 2R or at the ATR-based target. Include three alert tiers: Getting Ready (price nearing range boundary with volume building), Average (range break confirmed with volume), Strong (range break + high volume + trending sector). Risk 1% of account balance per trade.',
  },
  {
    id: 'ema-crossover',
    label: 'EMA Crossover Trend Follow',
    prompt:
      'EMA crossover trend-following strategy on 1-hour chart. Buy when the 9 EMA crosses above the 21 EMA with ADX(14) above 20 confirming trend strength. Sell/short when 9 EMA crosses below 21 EMA with ADX above 20. Exit long when 9 EMA crosses back below 21 EMA. Stop-loss below the most recent swing low for longs, above swing high for shorts. Take profit at 3R or exit on the next crossover signal. Include three alert tiers: Getting Ready (EMAs converging, crossover imminent), Average (crossover confirmed), Strong (crossover confirmed + ADX above 25 + volume above average). Size positions from account balance, 1% risk per trade.',
  },
  {
    id: 'gap-and-go',
    label: 'Gap-and-Go Day Trade',
    prompt:
      'Gap-and-go day trading strategy for stocks. Identify stocks gapping up more than 2% at market open compared to previous day close. Enter long when price holds above the pre-market high in the first 5 minutes after 9:30 AM open. Volume must be at least 2x average. Avoid stocks gapping more than 8% (too extended). Stop-loss below the pre-market low. Take profit by scaling out: 1/3 at 1R, 1/3 at 2R, and trailing the remaining 1/3 with a tight trail. Include three alert tiers: Getting Ready (stock gapping up > 2%, watch for pre-market high break), Average (pre-market high break confirmed with volume), Strong (pre-market high break + sector momentum + strong volume). Risk 1% of account balance per trade.',
  },
  {
    id: 'bollinger-squeeze',
    label: 'Bollinger Band Squeeze',
    prompt:
      'Bollinger Band squeeze strategy on daily chart. Identify a squeeze when the Bollinger Band width (upper band minus lower band / middle band) reaches its lowest point in 20 periods. Enter long when price closes above the upper Bollinger Band with above-average volume. Enter short when price closes below the lower band with volume. Stop-loss below the 20-period SMA (middle band). Take profit when price touches the opposite band or at 3R. Include three alert tiers: Getting Ready (bands contracting, squeeze forming), Average (squeeze release confirmed + break above/below band), Strong (squeeze release + volume surge + ADX rising). Position size from account balance, 1% risk per trade.',
  },
  {
    id: 'premarket-high',
    label: 'Pre-Market High Break',
    prompt:
      'Pre-market high breakout strategy for day trading stocks. Scan for stocks with pre-market gain over 3% before 9:30 AM. Enter long when price breaks above the pre-market high on the 1-minute chart after the market opens. Volume on the breakout candle must exceed 2x the average volume. Entry confirmation: close above pre-market high with strong candle (body > 50% of range). Stop-loss below the pre-market low. Scale out profits: exit 50% at 1R, move stop to breakeven, exit remaining at 2R or trail with 1-minute lows. Include three alert tiers: Getting Ready (stock on scanner, approaching pre-market high), Average (pre-market high break with volume), Strong (pre-market high break + volume + sector strength). Size from account balance, 1% risk per trade.',
  },
];