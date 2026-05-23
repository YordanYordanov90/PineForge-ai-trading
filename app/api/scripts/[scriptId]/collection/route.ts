import { and, eq } from 'drizzle-orm';
import { collections, scripts } from '@/drizzle/schema';
import { db, rowToSavedScript } from '@/lib/db';
import { setScriptCollectionSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { resolveOwnedScriptRoute } from '@/lib/api/resolve-owned-script-route';

type RouteContext = { params: Promise<{ scriptId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { scriptId: scriptIdParam } = await context.params;
  const route = await resolveOwnedScriptRoute(guard.ctx.userId, scriptIdParam);
  if (!route.ok) return route.response;

  const { userId, scriptId } = route;

  const body: unknown = await req.json().catch(() => null);
  const parsed = setScriptCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const { collectionId } = parsed.data;

  if (collectionId != null) {
    const [ownedCollection] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId)),
      )
      .limit(1);

    if (!ownedCollection) {
      return apiError('Forbidden', 403);
    }
  }

  const [updated] = await db
    .update(scripts)
    .set({ collectionId, updatedAt: new Date() })
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .returning();

  if (!updated) {
    return apiError('Failed to update script', 500);
  }

  return apiSuccess({ script: rowToSavedScript(updated) });
}
