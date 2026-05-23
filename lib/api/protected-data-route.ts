import 'server-only';

import { apiError } from '@/lib/api/envelope';
import { requireClerkSession } from '@/lib/auth/require-clerk-session';
import { checkDataRateLimit } from '@/lib/rate-limit/check';

export type ProtectedDataContext = {
  /** Clerk user id (string). Use `getDbUserIdByClerk` if you need the DB id. */
  userId: string;
};

export type ProtectedDataResult =
  | { ok: true; ctx: ProtectedDataContext }
  | { ok: false; response: Response };

/**
 * Gate for non-AI data routes (`/api/collections*`, `/api/scripts/*`
 * except generate/refine/explain). Runs Clerk session check, then the
 * per-user data limiter. AI routes keep using `protectAiRoute` which
 * applies the stricter AI cost limiter + IP defense.
 */
export async function protectDataRoute(): Promise<ProtectedDataResult> {
  const session = await requireClerkSession();
  if (!session.ok) {
    return { ok: false, response: session.response };
  }

  const rateLimit = await checkDataRateLimit(session.userId);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: apiError(
        rateLimit.reason,
        429,
        rateLimit.retryAfter
          ? { headers: { 'Retry-After': String(rateLimit.retryAfter) } }
          : undefined,
      ),
    };
  }

  return { ok: true, ctx: { userId: session.userId } };
}
