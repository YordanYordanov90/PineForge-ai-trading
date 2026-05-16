import 'server-only';

import { redis } from '@/lib/rate-limit/upstash';

const LOCK_PREFIX = 'pineforge:stream-lock:';
const LOCK_TTL_SECONDS = 300;

export type StreamLockResult =
  | { acquired: true; release: () => Promise<void> }
  | { acquired: false };

export async function acquireStreamLock(
  userId: string,
): Promise<StreamLockResult> {
  const key = `${LOCK_PREFIX}${userId}`;
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
