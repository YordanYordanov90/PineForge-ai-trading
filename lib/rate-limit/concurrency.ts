import 'server-only';

import { redis } from '@/lib/rate-limit/upstash';

const LOCK_PREFIX = 'pineforge:stream-lock:';
const LOCK_TTL_SECONDS = 300;

/** Separate scopes so an aborted /generate stream does not block Forge chat. */
export type StreamLockScope = 'forge' | 'generate';

export type StreamLockResult =
  | { acquired: true; release: () => Promise<void> }
  | { acquired: false };

function lockKey(scope: StreamLockScope, userId: string): string {
  return `${LOCK_PREFIX}${scope}:${userId}`;
}

export async function acquireStreamLock(
  userId: string,
  scope: StreamLockScope = 'generate',
): Promise<StreamLockResult> {
  const key = lockKey(scope, userId);
  const result = await redis.set(key, '1', { nx: true, ex: LOCK_TTL_SECONDS });

  if (result !== 'OK') {
    return { acquired: false };
  }

  return {
    acquired: true,
    release: async () => {
      await redis.del(key);
    },
  };
}

/**
 * Ensures the Redis stream lock is released when the client aborts
 * (navigation, `stop()`, or tab close). Without this, `onFinish` may
 * never run and the lock can block the user for up to {@link LOCK_TTL_SECONDS}.
 */
export function bindStreamLockRelease(
  lock: Extract<StreamLockResult, { acquired: true }>,
  signal: AbortSignal,
): () => Promise<void> {
  let released = false;

  const releaseOnce = async () => {
    if (released) return;
    released = true;
    await lock.release();
  };

  if (signal.aborted) {
    void releaseOnce();
  } else {
    signal.addEventListener('abort', () => void releaseOnce(), { once: true });
  }

  return releaseOnce;
}
