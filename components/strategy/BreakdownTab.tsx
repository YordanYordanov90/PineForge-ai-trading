'use client';

import { ExplainScriptPanel } from '@/components/strategy/ExplainScriptPanel';
import { AssumptionsSection } from '@/components/strategy/AssumptionsSection';
import type { StrategyAssumptions } from '@/lib/ai/parse-assumptions';

type BreakdownTabProps = {
  script: string;
  isTabActive: boolean;
  isScriptFinal: boolean;
  cancelKey: number;
  containedScroll?: boolean;
  onBreakdownChange?: (text: string | null) => void;
  assumptions?: StrategyAssumptions | null;
};

/**
 * Breakdown tab content (spec 60).
 * Wraps the existing AI-generated Breakdown (ExplainScriptPanel) and inserts
 * the Assumptions section (parsed from generation output) between the breakdown
 * text and the Checklist (Checklist lives in its own tab).
 */
export function BreakdownTab({
  script,
  isTabActive,
  isScriptFinal,
  cancelKey,
  containedScroll = true,
  onBreakdownChange,
  assumptions,
}: BreakdownTabProps) {
  return (
    <div className="min-h-0">
      <ExplainScriptPanel
        mode="breakdown"
        script={script}
        isTabActive={isTabActive}
        isScriptFinal={isScriptFinal}
        cancelKey={cancelKey}
        containedScroll={containedScroll}
        onBreakdownChange={onBreakdownChange}
      />
      <AssumptionsSection assumptions={assumptions ?? null} />
    </div>
  );
}
