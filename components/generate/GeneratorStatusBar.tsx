'use client';

import { useModKeyLabel } from '@/hooks/useShortcutLabel';

type GeneratorStatusBarProps = {
  isHistoryOpen?: boolean;
  isGenerating?: boolean;
};

export function GeneratorStatusBar({
  isHistoryOpen = false,
  isGenerating = false,
}: GeneratorStatusBarProps) {
  const mod = useModKeyLabel();

  let hint: string;
  if (isHistoryOpen) {
    hint = `[j/k] Navigate  [↵] Load  [d] Delete  [s] Star  [Esc] Close`;
  } else if (isGenerating) {
    hint = `[${mod}.] Stop`;
  } else {
    hint = `[1–7] Tabs  [${mod}K] Palette  [${mod}↵] Generate  [${mod}H] History`;
  }

  // Highlight bracketed key labels with neon per spec (400 dark / 700 light)
  const parts = hint.split(/(\[[^\]]+\])/g);

  return (
    <div
      className="h-6 w-full border-t border-zinc-800 bg-zinc-950/95 px-3 text-[10px] font-mono text-zinc-500 flex items-center select-none"
      aria-hidden="true"
    >
      <span>
        {parts.map((part, i) =>
          part.startsWith('[') && part.endsWith(']') ? (
            <span key={i} className="text-neon-700 dark:text-neon-400">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </span>
    </div>
  );
}
