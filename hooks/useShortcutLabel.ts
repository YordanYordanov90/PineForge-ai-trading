'use client';

import { useSyncExternalStore } from 'react';
import {
  SSR_MOD_KEY_LABEL,
  formatShortcut,
  getModKeyLabel,
  type ShortcutKey,
} from '@/lib/ui/shortcut-label';

function subscribe(): () => void {
  return () => {};
}

function getModKeySnapshot(): string {
  return getModKeyLabel();
}

function getModKeyServerSnapshot(): string {
  return SSR_MOD_KEY_LABEL;
}

/** Hydration-safe modifier label — SSR default, then platform-specific after mount. */
export function useModKeyLabel(): string {
  return useSyncExternalStore(
    subscribe,
    getModKeySnapshot,
    getModKeyServerSnapshot,
  );
}

/** Hydration-safe shortcut chord for inline hints and tooltips. */
export function useFormatShortcut(key: ShortcutKey): string {
  const mod = useModKeyLabel();
  return formatShortcut(key, mod);
}
