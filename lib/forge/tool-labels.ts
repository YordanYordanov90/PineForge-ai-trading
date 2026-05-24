export const FORGE_TOOL_LABELS: Record<string, string> = {
  search_user_scripts: 'Script Search',
  get_script_details: 'Script Details',
  run_health_score: 'Health Score',
  run_backtest_summary: 'Backtest Summary',
  generate_alert_templates: 'Alert Templates',
  refine_script: 'Refine Script',
  search_strategy_knowledge: 'Strategy Research',
};

export function prettifyForgeToolName(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
