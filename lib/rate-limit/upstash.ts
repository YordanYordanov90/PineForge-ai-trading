import 'server-only';

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const redis = Redis.fromEnv();

// Per-IP limiter — defense in depth (all AI routes still require Clerk session)
// 10 requests per 60 seconds per IP
export const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'pineforge:ip',
  analytics: true,
});

// Free tier per-user limiter — 3 requests per 24 hours (shared across all AI routes)
export const freeUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '24 h'),
  prefix: 'pineforge:free',
  analytics: true,
});

// Pro tier per-user limiter — 200 requests per 24 hours
export const proUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '24 h'),
  prefix: 'pineforge:pro',
  analytics: true,
});
