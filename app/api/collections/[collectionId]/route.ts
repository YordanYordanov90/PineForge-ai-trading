import { and, eq, isNotNull } from 'drizzle-orm';
import { collections, scripts } from '@/drizzle/schema';
import {
  db,
  findUserCollectionByNameInsensitive,
  rowToSavedCollection,
} from '@/lib/db';
import { renameCollectionSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { normalizeCollectionName } from '@/lib/collections/collections';
import { resolveOwnedCollectionRoute } from '@/lib/api/resolve-owned-collection-route';

type RouteContext = { params: Promise<{ collectionId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { collectionId: collectionIdParam } = await context.params;
  const route = await resolveOwnedCollectionRoute(
    guard.ctx.userId,
    collectionIdParam,
  );
  if (!route.ok) return route.response;

  const { userId, collectionId } = route;

  const body: unknown = await req.json().catch(() => null);
  const parsed = renameCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const normalized = normalizeCollectionName(parsed.data.name);
  if (normalized == null) {
    return apiError('Collection name is required', 400);
  }

  const conflict = await findUserCollectionByNameInsensitive(
    userId,
    normalized,
    collectionId,
  );
  if (conflict) {
    return apiError('A collection with this name already exists.', 409);
  }

  const [updated] = await db
    .update(collections)
    .set({ name: normalized })
    .where(
      and(eq(collections.id, collectionId), eq(collections.userId, userId)),
    )
    .returning();

  if (!updated) {
    return apiError('Failed to update collection', 500);
  }

  return apiSuccess({ collection: rowToSavedCollection(updated) });
}

/**
 * Deletes a user's collection.
 *
 * The `scripts.collection_id` FK is `ON DELETE no action`, so we must
 * unassign every referencing script before deleting the collection or the
 * delete would fail with a FK violation. Both writes are scoped to the
 * caller's `userId`, so cross-user side effects are structurally
 * impossible. neon-http does not expose transactions, so on partial
 * failure (unassign succeeds, delete fails) the user can simply retry —
 * the unassign step is idempotent (a second pass finds zero matching
 * rows) and no cross-user state is touched.
 */
export async function DELETE(_req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { collectionId: collectionIdParam } = await context.params;
  const route = await resolveOwnedCollectionRoute(
    guard.ctx.userId,
    collectionIdParam,
  );
  if (!route.ok) return route.response;

  const { userId, collectionId } = route;

  await db
    .update(scripts)
    .set({ collectionId: null, updatedAt: new Date() })
    .where(
      and(
        eq(scripts.userId, userId),
        eq(scripts.collectionId, collectionId),
        isNotNull(scripts.collectionId),
      ),
    );

  await db
    .delete(collections)
    .where(
      and(eq(collections.id, collectionId), eq(collections.userId, userId)),
    );

  return apiSuccess({ deleted: true });
}
