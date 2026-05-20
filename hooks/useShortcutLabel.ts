'use client';

import { useEffect, useState } from 'react';
import {
  SSR_MOD_KEY_LABEL,
  formatShortcut,
  getModKeyLabel,
  type ShortcutKey,
} from '@/lib/ui/shortcut-label';

/** Hydration-safe modifier label — SSR default, then platform-specific after mount. */
export function useModKeyLabel(): string {
  const [label, setLabel] = useState(SSR_MOD_KEY_LABEL);

  useEffect(() => {
    setLabel(getModKeyLabel());
  }, []);

  return label;
}

/** Hydration-safe shortcut chord for inline hints and tooltips. */
export function useFormatShortcut(key: ShortcutKey): string {
  const mod = useModKeyLabel();
  return formatShortcut(key, mod);
}
