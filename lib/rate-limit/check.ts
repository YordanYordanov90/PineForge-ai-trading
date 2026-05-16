import 'server-only';

import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { users } from '@/drizzle/schema';
import { db } from '@/lib/db';
import {
  ipRatelimit,
  freeUserRatelimit,
  proUserRatelimit,
} from '@/lib/rate-limit/upstash';

export type RateLimitResult =
  | { allowed: true; plan: string }
  | { allowed: false; reason: string; retryAfter?: number };

function clientIp(forwarded: string | null): string {
  if (!forwarded) return 'unknown';
  return forwarded.split(',')[0]?.trim() ?? 'unknown';
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const ip = clientIp((await headers()).get('x-forwarded-for'));

  const ipResult = await ipRatelimit.limit(ip);
  if (!ipResult.success) {
    return {
      allowed: false,
      reason: 'Too many requests. Please wait a moment.',
      retryAfter: Math.ceil((ipResult.reset - Date.now()) / 1000),
    };
  }

  const [user] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  const plan = user?.plan ?? 'free';
  const limiter = plan === 'pro' ? proUserRatelimit : freeUserRatelimit;
  const userResult = await limiter.limit(userId);

  if (!userResult.success) {
    return {
      allowed: false,
      reason:
        plan === 'free'
          ? 'Free tier limit reached (3 AI requests/day). Upgrade to Pro for unlimited access.'
          : 'Daily limit reached. Try again tomorrow.',
      retryAfter: Math.ceil((userResult.reset - Date.now()) / 1000),
    };
  }

  return { allowed: true, plan };
}
