# 20 — Upstash Redis Rate Limiting (SEC-001 Fix)

Add per-IP and per-user rate limiting to all AI routes using Upstash Redis.
This closes SEC-001 — the only HIGH security issue from the audit report.
Follows Step 3 (history migration). Per-user limits enforce the free/pro
tier split introduced in Step 3.

## What to Install

- `@upstash/ratelimit`
- `@upstash/redis`

```powershell
npm install @upstash/ratelimit @upstash/redis
```

## Environment Variables

Add to `.env.local` and `.env.example`:

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Implementation

### Step 1 — Create lib/upstash.ts

```ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = Redis.fromEnv()

// Per-IP limiter — protects unauthenticated surface
// 10 requests per 60 seconds per IP
export const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60s'),
  prefix: 'pineforge:ip',
  analytics: true,
})

// Free tier per-user limiter
// 3 requests per 24 hours per Clerk userId
export const freeUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '86400s'),
  prefix: 'pineforge:free',
  analytics: true,
})

// Pro tier per-user limiter
// 200 requests per 24 hours per Clerk userId (effectively unlimited)
export const proUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '86400s'),
  prefix: 'pineforge:pro',
  analytics: true,
})
```

### Step 2 — Create lib/rate-limit-check.ts

Centralize the rate limit enforcement logic used by all AI routes:

```ts
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { ipRatelimit, freeUserRatelimit, proUserRatelimit } from '@/lib/upstash'
import { headers } from 'next/headers'

export type RateLimitResult =
  | { allowed: true; userId: string | null }
  | { allowed: false; reason: string; retryAfter?: number }

export async function checkRateLimit(): Promise<RateLimitResult> {
  const { userId } = await auth()
  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown'

  // Step 1: IP check (applies to everyone including signed-in users)
  const ipResult = await ipRatelimit.limit(ip)
  if (!ipResult.success) {
    return {
      allowed: false,
      reason: 'Too many requests. Please wait a moment.',
      retryAfter: Math.ceil((ipResult.reset - Date.now()) / 1000),
    }
  }

  // Step 2: if signed in, apply per-user tier limit
  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })
    const plan = user?.plan ?? 'free'
    const limiter = plan === 'pro' ? proUserRatelimit : freeUserRatelimit
    const userResult = await limiter.limit(userId)

    if (!userResult.success) {
      return {
        allowed: false,
        reason: plan === 'free'
          ? 'Free tier limit reached (3 generations/day). Upgrade to Pro for unlimited access.'
          : 'Daily limit reached. Try again tomorrow.',
        retryAfter: Math.ceil((userResult.reset - Date.now()) / 1000),
      }
    }
  }

  return { allowed: true, userId }
}
```

### Step 3 — Apply rate limiting to all AI routes

Add the rate limit check to the top of each AI route handler, before
any Zod validation or LLM call:

**Routes to update:**
- `app/api/generate/route.ts`
- `app/api/refine-script/route.ts`
- `app/api/improve-prompt/route.ts`
- `app/api/explain-script/route.ts` (if exists)

**Pattern for each route:**

```ts
import { checkRateLimit } from '@/lib/rate-limit-check'

export async function POST(request: Request) {
  // Rate limit check FIRST — before parsing body or calling Grok
  const rateLimit = await checkRateLimit()
  if (!rateLimit.allowed) {
    return Response.json(
      { error: rateLimit.reason },
      {
        status: 429,
        headers: rateLimit.retryAfter
          ? { 'Retry-After': String(rateLimit.retryAfter) }
          : undefined,
      }
    )
  }

  // ... existing Zod validation and Grok call continues unchanged
}
```

### Step 4 — Handle 429 responses in the UI

The generator UI already handles error states. Add 429 handling:

In `components/strategy/GenerateExperience.tsx` (or wherever API errors
are caught from `/api/generate`):

- Detect HTTP 429 response status
- Show a specific error message in the output card error state:
  - Free tier message: "You've used your 3 free generations today.
    Upgrade to Pro for unlimited access." + upgrade CTA button
    (button links to `/pricing` — page can be a placeholder for now)
  - Generic rate limit message: "Too many requests. Please try again
    in a moment."
- Do NOT use a toast for 429 — show inline in the output card
  (consistent with existing error handling pattern)

## Scope Limits

- Do not add a `/pricing` page in this spec — the 429 error CTA can
  link to it as a placeholder (404 is acceptable until Phase 5)
- Do not add Stripe or billing logic — plan field is set manually for
  now (pro users updated directly in DB or Drizzle Studio)
- Do not rate limit the `/api/users/sync` route
- Do not rate limit non-AI routes (projects, scripts CRUD)
- Keep the `checkRateLimit` function in one place — do not duplicate
  the logic across routes

## Security Notes

- IP header `x-forwarded-for` is set by Vercel's edge — safe to trust
  in production. In local dev it may be absent — `'unknown'` fallback
  is acceptable for development.
- Rate limit keys use prefixes (`pineforge:ip`, `pineforge:free`, `pineforge:pro`)
  to avoid collision with any future Redis usage.
- `analytics: true` on Upstash Ratelimit enables the Upstash dashboard
  analytics — useful for monitoring abuse patterns.

## Check When Done

- `@upstash/ratelimit` and `@upstash/redis` installed
- `lib/upstash.ts` exports three limiters (IP, free, pro)
- `lib/rate-limit-check.ts` centralizes enforcement logic
- All four AI routes check rate limit before any other logic
- 429 responses include `Retry-After` header
- Free tier 429 shows upgrade message in output card
- Generic 429 shows friendly inline message
- SEC-001 is resolved — AI routes no longer publicly abusable
- `npm run build` passes with no type errors