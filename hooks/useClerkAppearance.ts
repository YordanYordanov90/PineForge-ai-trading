'use client';

import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import {
  clerkAppearanceDark,
  clerkAppearanceLight,
} from '@/lib/auth/clerk-appearance';

export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();

  return useMemo(
    () => (resolvedTheme === 'light' ? clerkAppearanceLight : clerkAppearanceDark),
    [resolvedTheme],
  );
}
