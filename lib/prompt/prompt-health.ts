export type PromptHealthLevel = 'weak' | 'fair' | 'strong';

export type PromptHealthResult = {
  level: PromptHealthLevel;
  label: string;
  hint: string;
};

type DetailCategory = {
  id: string;
  pattern: RegExp;
};

/** Explainable keyword groups common in trading strategy prompts. */
const DETAIL_CATEGORIES: DetailCategory[] = [
  {
    id: 'timeframe',
    pattern:
      /\b(\d+\s*(m|min|minute|h|hour|d|day)s?|daily|weekly|intraday|timeframe|opening range|pre-?market)\b/i,
  },
  {
    id: 'entry',
    pattern:
      /\b(entry|enter|buy|sell|long|short|signal|trigger|breakout|cross(es|over)?|when|confirm)\b/i,
  },
  {
    id: 'risk',
    pattern: /\b(stop|stop-loss|invalidation|risk|sl\b|\d+(\.\d+)?\s*r\b|rr\b|risk per trade)\b/i,
  },
  {
    id: 'exit',
    pattern: /\b(take profit|take-profit|target|tp\b|exit|trail(ing)?|profit|scale out)\b/i,
  },
  {
    id: 'context',
    pattern:
      /\b(volume|rvol|vwap|rsi|ema|macd|adx|bollinger|stock|forex|crypto|futures|sector|hod|lod)\b/i,
  },
  {
    id: 'alerts',
    pattern: /\b(alert|getting ready|average|strong)\b/i,
  },
];

const MIN_FAIR_LENGTH = 80;
const MIN_STRONG_LENGTH = 160;

function countMatchedCategories(text: string): number {
  return DETAIL_CATEGORIES.filter((cat) => cat.pattern.test(text)).length;
}

/**
 * Client-side prompt quality heuristic — length plus presence of common strategy fields.
 * Does not block generation; for guidance only.
 */
export function evaluatePromptHealth(prompt: string): PromptHealthResult {
  const text = prompt.trim();

  if (!text) {
    return {
      level: 'weak',
      label: 'Empty',
      hint: 'Describe timeframe, entry triggers, stops, and take-profit rules.',
    };
  }

  const length = text.length;
  const detailCount = countMatchedCategories(text);

  if (length < 40 || detailCount === 0) {
    return {
      level: 'weak',
      label: 'Thin prompt',
      hint: 'Add timeframe, entry logic, and how you manage risk (stop / R multiple).',
    };
  }

  if (length >= MIN_STRONG_LENGTH && detailCount >= 3) {
    return {
      level: 'strong',
      label: 'Well detailed',
      hint: 'Covers several strategy basics — good starting point for generation.',
    };
  }

  if (length >= MIN_FAIR_LENGTH && detailCount >= 2) {
    return {
      level: 'fair',
      label: 'Fair detail',
      hint: 'Consider adding clearer entry triggers, stops, or take-profit rules.',
    };
  }

  if (detailCount >= 3 && length >= MIN_FAIR_LENGTH) {
    return {
      level: 'fair',
      label: 'Fair detail',
      hint: 'Good topic coverage — a bit more length will help the model.',
    };
  }

  return {
    level: 'weak',
    label: 'Thin prompt',
    hint: 'Mention timeframe, entries, stops, and targets so the model has enough context.',
  };
}

export const PROMPT_HEALTH_STYLES: Record<
  PromptHealthLevel,
  { badge: string; dot: string }
> = {
  weak: {
    badge: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-400',
  },
  fair: {
    badge: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
  },
  strong: {
    badge: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
};
