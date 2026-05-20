export type LandingExample = {
  id: string;
  label: string;
  filename: string;
  lines: string[];
};

export const LANDING_EXAMPLES: LandingExample[] = [
  {
    id: 'ema-cross',
    label: 'EMA 9/21 Cross',
    filename: 'ema_cross.pine',
    lines: [
      '//@version=5',
      'indicator("EMA 9/21 Cross", overlay=true)',
      '',
      'ema9  = ta.ema(close, 9)',
      'ema21 = ta.ema(close, 21)',
      'bull  = ta.crossover(ema9, ema21)',
      '',
      'alertcondition(bull, "Average Signal", "EMA cross up")',
      'plot(ema9,  "EMA 9",  color=color.teal)',
      'plot(ema21, "EMA 21", color=color.orange)',
    ],
  },
  {
    id: 'bollinger-squeeze',
    label: 'Bollinger Squeeze',
    filename: 'bb_squeeze.pine',
    lines: [
      '//@version=5',
      'indicator("Bollinger Squeeze", overlay=true)',
      '',
      '[mid, up, lo] = ta.bb(close, 20, 2)',
      'width = (up - lo) / mid',
      'squeeze = width == ta.lowest(width, 20)',
      '',
      'alertcondition(squeeze, "Getting Ready", "Bands tightening")',
      'plot(up, "Upper", color=color.gray)',
      'plot(lo, "Lower", color=color.gray)',
    ],
  },
  {
    id: 'macd-divergence',
    label: 'MACD Divergence',
    filename: 'macd_div.pine',
    lines: [
      '//@version=5',
      'indicator("MACD Divergence", overlay=false)',
      '',
      '[macd, signal, hist] = ta.macd(close, 12, 26, 9)',
      'bullDiv = low < low[1] and macd > macd[1]',
      '',
      'alertcondition(bullDiv, "Strong Signal", "Bullish MACD div")',
      'plot(macd,   "MACD",   color=color.teal)',
      'plot(signal, "Signal", color=color.orange)',
    ],
  },
];
