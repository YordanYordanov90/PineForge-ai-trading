import { and, eq } from 'drizzle-orm';
import { collections } from '@/drizzle/schema';
import { db, getDbUserIdByClerk } from '@/lib/db';
import { apiError } from '@/lib/api/envelope';
import { parsePositiveInt } from '@/lib/api/parse-route-id';

export type OwnedCollectionRouteOk = {
  ok: true;
  userId: number;
  collectionId: number;
};
export type OwnedCollectionRouteDenied = { ok: false; response: Response };

/**
 * Resolves the DB user + collection id and asserts ownership for
 * `/api/collections/[collectionId]` PATCH/DELETE.
 *
 * Expects an already-validated Clerk user id — callers should pass
 * `guard.ctx.userId` from `protectDataRoute`. The session check is not
 * duplicated here.
 */
export async function resolveOwnedCollectionRoute(
  clerkUserId: string,
  collectionIdParam: string,
): Promise<OwnedCollectionRouteOk | OwnedCollectionRouteDenied> {
  const collectionId = parsePositiveInt(collectionIdParam);
  if (collectionId == null) {
    return {
      ok: false,
      response: apiError('Invalid collection id', 400),
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
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(eq(collections.id, collectionId), eq(collections.userId, userId)),
    )
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      response: apiError('Forbidden', 403),
    };
  }

  return { ok: true, userId, collectionId };
}
