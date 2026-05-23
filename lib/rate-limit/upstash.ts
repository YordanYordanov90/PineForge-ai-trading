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

// Data-route per-user limiter — defense-in-depth for CRUD endpoints
// (collections, scripts, search, mutations). Plan-agnostic: data
// operations are not a paid feature, only the AI generation cost is.
// 120 requests per minute is generous for normal use (history reload,
// bulk tag/star edits) but kills bot-like behavior.
export const dataUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '60 s'),
  prefix: 'pineforge:data',
  analytics: true,
});
