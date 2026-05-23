'use client';

import { useEffect } from 'react';

/**
 * Logs an unhandled error to the console on mount.
 *
 * Centralized so every App Router error boundary (`app/error.tsx`,
 * `app/global-error.tsx`, `app/generate/error.tsx`) shares the same
 * logging surface. Future remote-logging wiring (Sentry, Vercel Agent,
 * etc.) plugs in here once — boundaries stay untouched.
 */
export function useErrorLogger(error: Error & { digest?: string }): void {
  useEffect(() => {
    console.error(error);
  }, [error]);
}
