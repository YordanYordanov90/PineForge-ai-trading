import 'server-only';

import { requireClerkSession } from '@/lib/auth/require-clerk-session';
import { checkRateLimit } from '@/lib/rate-limit/check';

export type UserPlan = string;

export type ProtectedAiContext = {
  userId: string;
  plan: UserPlan;
  req: Request;
};

export type ProtectedAiResult =
  | { ok: true; ctx: ProtectedAiContext }
  | { ok: false; response: Response };

export function jsonApiError(
  status: number,
  message: string,
  extraHeaders?: HeadersInit,
): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: extraHeaders,
    },
  );
}

export async function protectAiRoute(req: Request): Promise<ProtectedAiResult> {
  const session = await requireClerkSession();
  if (!session.ok) {
    return { ok: false, response: session.response };
  }

  const rateLimit = await checkRateLimit(session.userId);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: jsonApiError(
        429,
        rateLimit.reason,
        rateLimit.retryAfter
          ? { 'Retry-After': String(rateLimit.retryAfter) }
          : undefined,
      ),
    };
  }

  return {
    ok: true,
    ctx: {
      userId: session.userId,
      plan: rateLimit.plan,
      req,
    },
  };
}
