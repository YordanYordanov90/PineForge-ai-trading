export type ShortcutKey = 'enter' | 'k' | 't';

/** Stable SSR/hydration default — updated after mount via `useModKeyLabel`. */
export const SSR_MOD_KEY_LABEL = 'Ctrl';

const KEY_LABEL: Record<ShortcutKey, string> = {
  enter: '↵',
  k: 'K',
  t: 'T',
};

/** Platform-aware modifier label (client-only; use `useModKeyLabel` in rendered UI). */
export function getModKeyLabel(): string {
  if (typeof navigator === 'undefined') return SSR_MOD_KEY_LABEL;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? '⌘' : SSR_MOD_KEY_LABEL;
}

/** Formats a chord such as `⌘+↵` or `Ctrl+K`. Pass `modLabel` when using `useModKeyLabel`. */
export function formatShortcut(key: ShortcutKey, modLabel: string = SSR_MOD_KEY_LABEL): string {
  return `${modLabel}+${KEY_LABEL[key]}`;
}
