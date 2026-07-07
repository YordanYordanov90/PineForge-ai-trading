export type OutputTab =
  | 'script'
  | 'breakdown'
  | 'checklist'
  | 'health'
  | 'backtest'
  | 'alerts'
  | 'compare';

export const OUTPUT_TABS: readonly OutputTab[] = [
  'script',
  'breakdown',
  'checklist',
  'health',
  'backtest',
  'alerts',
  'compare',
] as const;

export function isOutputTab(value: string): value is OutputTab {
  return (OUTPUT_TABS as readonly string[]).includes(value);
}