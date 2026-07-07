'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const USER_SYNC_SESSION_KEY = 'pineforge_user_synced';
const LEGACY_USER_SYNC_SESSION_KEY = 'grokts_user_synced';

/**
 * One-shot POST `/api/users/sync` after sign-in so the Neon user row exists
 * before the first script save. Retries on the next visit if the call fails.
 */
export function useUserSync() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || typeof window === 'undefined') return;
    if (
      sessionStorage.getItem(USER_SYNC_SESSION_KEY) === '1' ||
      sessionStorage.getItem(LEGACY_USER_SYNC_SESSION_KEY) === '1'
    ) {
      return;
    }

    void (async () => {
      try {
        const res = await fetch('/api/users/sync', { method: 'POST' });
        if (res.ok) {
          sessionStorage.setItem(USER_SYNC_SESSION_KEY, '1');
        }
      } catch {
        // retry on next visit
      }
    })();
  }, [isLoaded, isSignedIn]);
}