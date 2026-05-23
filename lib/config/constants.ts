export const MAX_PROMPT_LENGTH = 1500;

/** Free-tier AI actions per 24h — keep in sync with `lib/rate-limit/upstash.ts`. */
export const FREE_TIER_DAILY_GENERATIONS = 3;

/** Pro-tier AI actions per 24h — keep in sync with `lib/rate-limit/upstash.ts`. */
export const PRO_TIER_DAILY_GENERATIONS = 200;

/** Landing / auth social proof (marketing claim). */
export const LANDING_TRADER_COUNT_LABEL = '2,400+ traders';

/** Subtext under primary landing CTAs. */
export const LANDING_CTA_SUBTEXT =
  `${FREE_TIER_DAILY_GENERATIONS} free generations / day. No credit card required.`;

/** Marketing stat for hero / feature stat section. */
export const LANDING_AVG_GENERATION_LABEL = '~14s';

export type GrokModel = {
  id: 'grok-4-1-fast-reasoning' | 'grok-4-1-fast-non-reasoning' | 'grok-4';
  label: string;
  speedHint: string;
  tooltip: string;
  recommended?: boolean;
};

export const GROK_MODELS: GrokModel[] = [
  {
    id: 'grok-4-1-fast-non-reasoning',
    label: 'Fast (Recommended)',
    speedHint: '≈ 8–12 seconds',
    tooltip: 'Quickest responses, excellent for most strategies',
    recommended: true,
  },
  {
    id: 'grok-4-1-fast-reasoning',
    label: 'Balanced',
    speedHint: '≈ 20–30 seconds',
    tooltip: 'Better logic and fewer mistakes on complex rules',
  },
  {
    id: 'grok-4',
    label: 'Maximum Quality (Slowest)',
    speedHint: '≈ 40+ seconds',
    tooltip: 'Most powerful, best for very advanced strategies',
  },
];

export const DEFAULT_MODEL = 'grok-4-1-fast-non-reasoning' as const;

export const MAX_HISTORY_ENTRIES = 50;

/**
 * Forge Agent conversation storage cap per user — keep in sync with the
 * memory schema spec (`52`) and CRUD spec (`54`). The CRUD POST handler
 * runs FIFO eviction (delete the oldest by `updated_at`) when a user is
 * already at the cap.
 */
export const MAX_CONVERSATIONS_PER_USER = 50;

/**
 * Forge Agent per-conversation message cap (spec 52 + 55). When a
 * thread reaches this many messages the streaming endpoint returns
 * 400 with a friendly "start a new conversation" message rather than
 * appending — keeps prompt budget predictable and the conversation
 * row from growing unbounded.
 */
export const MAX_MESSAGES_PER_CONVERSATION = 200;

/**
 * Maximum tool-call steps the Forge Agent can take in a single turn
 * (spec 55 § Flow → "maxSteps: 5"). The agent uses these steps to
 * call up to 5 tools before it must respond with text — prevents
 * infinite tool loops while leaving room for orchestration chains
 * (e.g. health → backtest → alerts on the same script).
 */
export const FORGE_AGENT_MAX_STEPS = 5;

/** Full-script refinements need a higher ceiling than initial generate (900). */
export const REFINE_MAX_OUTPUT_TOKENS = 2000;

/** Plain-English breakdown and TradingView checklist from /api/explain-script. */
export const EXPLAIN_MAX_OUTPUT_TOKENS = 1800;

/** Structured Strategy Health Score from /api/health-score. */
export const HEALTH_SCORE_MAX_OUTPUT_TOKENS = 700;

/** Provider webhook JSON templates from /api/alert-templates. */
export const ALERT_TEMPLATES_MAX_OUTPUT_TOKENS = 4096;

/** Structured backtesting checklist from /api/backtesting-summary. */
export const BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS = 1200;

export const CHAR_WARNING_THRESHOLD = 1200;

export const CHAR_DANGER_THRESHOLD = 1400;

export const DEFAULT_RR_RATIO = 2;

/** Pine alert() message strings — keep in sync with `pine-generate-system.ts` and webhook export. */
export const PINE_WEBHOOK_ALERT_MESSAGES = [
  'Buy Getting Ready',
  'Average Buy Trigger',
  'Strong Buy Trigger',
] as const;

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