import { getPreviousVersionScript } from '@/lib/scripts/lineage';
import type { SavedScript } from '@/lib/types';
import type { LineageState } from '@/hooks/strategy/lineage-types';

export type StrategyCompareInput = {
  entries: readonly SavedScript[];
  lineageState: LineageState | null;
  historyLineageReady: boolean;
  generatedScript: string;
  scriptCompareBaseline: string | null;
  isOutputBusy: boolean;
};

export type StrategyCompareState = {
  compareAvailable: boolean;
  compareBeforeScript: string;
  compareBeforeLabel: string;
  compareAfterLabel: string;
  compareEmptyHint: string;
};

export function buildStrategyCompareState(
  input: StrategyCompareInput,
): StrategyCompareState {
  const {
    entries,
    lineageState,
    historyLineageReady,
    generatedScript,
    scriptCompareBaseline,
    isOutputBusy,
  } = input;

  const comparePreviousScript =
    lineageState && lineageState.lastVersion >= 2
      ? getPreviousVersionScript(
          entries,
          lineageState.rootId,
          lineageState.lastVersion,
        )
      : null;

  const lineageCompareAvailable = Boolean(
    historyLineageReady &&
      lineageState &&
      lineageState.lastVersion >= 2 &&
      comparePreviousScript != null,
  );

  const hasManualEdits = Boolean(
    scriptCompareBaseline !== null && generatedScript !== scriptCompareBaseline,
  );

  const compareAvailable = Boolean(
    !isOutputBusy &&
      historyLineageReady &&
      generatedScript.trim() &&
      (lineageCompareAvailable || hasManualEdits),
  );

  let compareBeforeScript = '';
  if (hasManualEdits && scriptCompareBaseline !== null) {
    compareBeforeScript = scriptCompareBaseline;
  } else if (lineageCompareAvailable && comparePreviousScript != null) {
    compareBeforeScript = comparePreviousScript;
  }

  const compareBeforeLabel = hasManualEdits
    ? 'Last generated output'
    : `v${(lineageState?.lastVersion ?? 1) - 1} (previous)`;

  const compareAfterLabel = hasManualEdits
    ? 'Current (edited)'
    : `v${lineageState?.lastVersion ?? 1} (current)`;

  let compareEmptyHint: string;
  if (!historyLineageReady) {
    compareEmptyHint = 'Generate or load a script from History to use Compare.';
  } else if (!generatedScript.trim()) {
    compareEmptyHint = 'Generate a script first.';
  } else if (
    lineageState &&
    lineageState.lastVersion >= 2 &&
    comparePreviousScript == null
  ) {
    compareEmptyHint =
      'The previous version is not in Script History anymore (older entries may be dropped).';
  } else {
    compareEmptyHint =
      'Edit the Pine Script in the Script tab, or refine once, to enable Compare.';
  }

  return {
    compareAvailable,
    compareBeforeScript,
    compareBeforeLabel,
    compareAfterLabel,
    compareEmptyHint,
  };
}
