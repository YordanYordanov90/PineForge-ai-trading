import type { BacktestSummarySections } from '@/lib/api/validation';

type SectionId = keyof BacktestSummarySections;

type SectionDescriptor = {
  id: SectionId;
  heading: string;
};

/**
 * Heading order and labels for the assembled Markdown. Kept stable so the
 * `markdown` field is deterministic across calls — the same `sections` input
 * always produces the same output.
 */
const SECTION_ORDER: readonly SectionDescriptor[] = [
  { id: 'recommendedTimeframes', heading: 'Recommended Timeframes' },
  { id: 'recommendedMarkets', heading: 'Recommended Markets' },
  { id: 'equityCurveChecks', heading: 'What To Check In The Equity Curve' },
  { id: 'failureModes', heading: 'Common Failure Modes' },
  { id: 'testPlan', heading: 'Backtesting Plan' },
] as const;

function formatBullet(item: string): string {
  return `- ${item.replace(/\s+/g, ' ').trim()}`;
}

/**
 * Assemble normalized Markdown from validated backtest summary sections.
 *
 * - stable heading order (see `SECTION_ORDER`)
 * - one bullet list per section, one bullet per item
 * - no extra prose, no leading/trailing whitespace
 * - whitespace inside each bullet collapsed to single spaces
 *
 * Inputs must already be validated by `backtestSummarySectionsSchema`. This
 * helper is deterministic and side-effect free.
 */
export function assembleBacktestSummaryMarkdown(
  sections: BacktestSummarySections,
): string {
  const blocks: string[] = [];

  for (const section of SECTION_ORDER) {
    const items = sections[section.id];
    if (!items.length) continue;
    const bullets = items.map(formatBullet).join('\n');
    blocks.push(`## ${section.heading}\n${bullets}`);
  }

  return blocks.join('\n\n').trim();
}
