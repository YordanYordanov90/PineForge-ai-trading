import { and, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db, getDbUserIdByClerk } from '@/lib/db';
import { apiError } from '@/lib/api/envelope';
import { parsePositiveInt } from '@/lib/api/parse-route-id';

export type OwnedScriptRouteOk = { ok: true; userId: number; scriptId: number };
export type OwnedScriptRouteDenied = { ok: false; response: Response };

/**
 * Resolves the DB user + script id and asserts ownership for narrow
 * `/api/scripts/[scriptId]/*` routes. Cross-user access returns 403.
 *
 * Expects an already-validated Clerk user id — callers should pass
 * `guard.ctx.userId` from `protectDataRoute`. The session check is not
 * duplicated here.
 */
export async function resolveOwnedScriptRoute(
  clerkUserId: string,
  scriptIdParam: string,
): Promise<OwnedScriptRouteOk | OwnedScriptRouteDenied> {
  const scriptId = parsePositiveInt(scriptIdParam);
  if (scriptId == null) {
    return {
      ok: false,
      response: apiError('Invalid script id', 400),
    };
  }

  const userId = await getDbUserIdByClerk(clerkUserId);
  if (userId == null) {
    return {
      ok: false,
      response: apiError('User not found', 404),
    };
  }

  const [existing] = await db
    .select({ id: scripts.id })
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      response: apiError('Forbidden', 403),
    };
  }

  return { ok: true, userId, scriptId };
}
