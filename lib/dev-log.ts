/**
 * Dev-only logging. Production stays silent — never leak internals to users or logs.
 */
export function devWarn(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}