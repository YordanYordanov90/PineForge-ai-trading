# 20 — Upstash Redis Rate Limiting (SEC-001 Fix)

Add per-IP and per-user rate limiting to all AI routes using Upstash Redis.
This closes SEC-001 — the only HIGH security issue from the audit report.
Follows history migration (`19-history-migration.md`). Per-user limits enforce the
free/pro tier split from the `users.plan` column.

## Prerequisites (done)

- **Fix 5 (abort propagation):** All four AI routes pass `abortSignal: req.signal`
  into `streamText` / `generateText` so client cancel stops upstream generation.
- **Auth:** AI routes call `requireClerkSession()` from `@/lib/auth/require-clerk-session`
  (JSON 401, not HTML redirect).
- **DB:** `import { db } from '@/lib/db'` (re-exports from `lib/db/client.ts`).

## What to Install

- `@upstash/ratelimit`
- `@upstash/redis`

```bash
npm install @upstash/ratelimit @upstash/redis
```

## Environment Variables

Add to `.env.local` (and document in `README.md` — there is no `.env.example` in repo yet):

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Implementation

### Step 1 — Create `lib/rate-limit/upstash.ts`

Prefer `lib/rate-limit/` to match `lib/auth/`, `lib/api/`, `lib/db/`.

```ts
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

// Free tier per-user limiter
// 3 requests per 24 hours per Clerk userId (all AI routes share this bucket)
export const freeUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '24 h'),
  prefix: 'pineforge:free',
  analytics: true,
});

// Pro tier per-user limiter
// 200 requests per 24 hours per Clerk userId
export const proUserRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '24 h'),
  prefix: 'pineforge:pro',
  analytics: true,
});
```

### Step 2 — Create `lib/rate-limit/check.ts`

Centralize enforcement. Accept `userId` from `requireClerkSession()` so routes
do not call `auth()` twice.

```ts
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { users } from '@/drizzle/schema';
import { db } from '@/lib/db';
import { ipRatelimit, freeUserRatelimit, proUserRatelimit } from '@/lib/rate-limit/upstash';

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfter?: number };

function clientIp(forwarded: string | null): string {
  if (!forwarded) return 'unknown';
  // Vercel may send "client, proxy1, proxy2" — use the left-most (client) IP
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

  return { allowed: true };
}
```

### Step 3 — Apply rate limiting to all AI routes

**Handler order (important):**

1. `requireClerkSession()` → 401 if missing
2. `checkRateLimit(session.userId)` → 429 if exceeded
3. Parse body (Zod) → 400
4. LLM call (already has `abortSignal: req.signal`)

**Routes to update:**

- `app/api/generate/route.ts`
- `app/api/refine-script/route.ts`
- `app/api/improve-prompt/route.ts`
- `app/api/explain-script/route.ts`

**Pattern for each route:**

```ts
import { checkRateLimit } from '@/lib/rate-limit/check';
import { requireClerkSession } from '@/lib/auth/require-clerk-session';

export async function POST(req: Request) {
  const session = await requireClerkSession();
  if (!session.ok) return session.response;

  const rateLimit = await checkRateLimit(session.userId);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: rateLimit.reason },
      {
        status: 429,
        headers: rateLimit.retryAfter
          ? { 'Retry-After': String(rateLimit.retryAfter) }
          : undefined,
      },
    );
  }

  // ... existing Zod validation and Grok call (keep abortSignal: req.signal)
}
```

**Shared daily bucket:** `generate`, `refine-script`, `improve-prompt`, and
`explain-script` all consume the same per-user limit (3/day free, 200/day pro).
Copy in UI should say "AI requests" not only "generations" where refine/explain
are involved.

### Step 4 — Handle 429 responses in the UI

Use existing `messageFromApiErrorJson` from `@/lib/api/message-from-api-error`.
The API returns `{ error: string }` with status 429 — the helper already surfaces
`error` when present.

**Update these call sites** (toast today; keep toast for 429 or switch to inline
per product preference below):

| File | Endpoints |
|------|-----------|
| `hooks/useScriptGeneration.ts` | `/api/generate`, `/api/refine-script` |
| `hooks/usePromptImprover.ts` | `/api/improve-prompt` |
| `components/strategy/ExplainScriptPanel.tsx` | `/api/explain-script` |

For **generate** (primary UX), prefer inline error in the output card when
`res.status === 429`:

- Free tier: show API `error` text + upgrade CTA linking to `/pricing` (placeholder OK)
- IP / generic: "Too many requests. Please try again in a moment."

Refine / improve / explain can keep **toast** for 429 unless you want parity with
generate — minimum bar is a clear message via `messageFromApiErrorJson`, not a
generic "Request failed".

Do **not** add a `/pricing` page in this task.

## Scope Limits

- Do not add Stripe or billing — set `users.plan` manually in DB / Drizzle Studio
- Do not rate limit `/api/users/sync` or `/api/scripts` CRUD
- Do not add weighted per-route quotas yet (see `context/fixes.md` Fix 3)
- Do not add model entitlement checks yet (see `context/fixes.md` Fix 2)
- Keep `checkRateLimit` in one module — no per-route duplication

## Security Notes

- `x-forwarded-for` is set by Vercel in production; `'unknown'` fallback is fine locally
- All AI routes require Clerk — IP limiter is defense in depth, not the primary gate
- Redis key prefixes: `pineforge:ip`, `pineforge:free`, `pineforge:pro`
- `analytics: true` enables Upstash dashboard metrics

## Check When Done

- [x] `@upstash/ratelimit` and `@upstash/redis` installed
- [x] `lib/rate-limit/upstash.ts` exports three limiters
- [x] `lib/rate-limit/check.ts` centralizes enforcement (takes `userId` from session)
- [x] All four AI routes: auth → rate limit → Zod → LLM
- [x] 429 responses include `Retry-After` when available
- [x] Generate UI shows free-tier upgrade message on 429 (inline in output card)
- [x] Other AI hooks show readable 429 via `messageFromApiErrorJson`
- [x] `npm run build` passes
- [x] SEC-001 closed in `context/progress-tracker.md`
