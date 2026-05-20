/**
 * TradingView Pine Editor Utilities
 * Deep link URL format is undocumented and unreliable.
 * Reliable approach: copy script to clipboard + open Pine Editor in new tab.
 * User arrives at Pine Editor with script ready to paste (Ctrl+V).
 */

export async function copyAndOpenTradingView(script: string): Promise<void> {
  if (!script?.trim()) return;

  try {
    await navigator.clipboard.writeText(script);
  } catch {
    // clipboard failed silently — user can still paste manually
  }

  window.open(
    'https://www.tradingview.com/pine/',
    '_blank',
    'noopener,noreferrer',
  );
}
