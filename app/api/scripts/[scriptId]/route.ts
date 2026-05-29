import { and, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db, rowToSavedScript } from '@/lib/db';
import { renameScriptSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { resolveOwnedScriptRoute } from '@/lib/api/resolve-owned-script-route';

type RouteContext = { params: Promise<{ scriptId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { scriptId: scriptIdParam } = await context.params;
  const route = await resolveOwnedScriptRoute(guard.ctx.userId, scriptIdParam);
  if (!route.ok) return route.response;

  const { userId, scriptId } = route;

  const [row] = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);

  if (!row) {
    return apiError('Script not found', 404);
  }

  return apiSuccess({ script: rowToSavedScript(row) });
}

export async function PATCH(req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { scriptId: scriptIdParam } = await context.params;
  const route = await resolveOwnedScriptRoute(guard.ctx.userId, scriptIdParam);
  if (!route.ok) return route.response;

  const { userId, scriptId } = route;

  const body: unknown = await req.json().catch(() => null);
  const parsed = renameScriptSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const [updated] = await db
    .update(scripts)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .returning();

  if (!updated) {
    return apiError('Failed to update script', 500);
  }

  return apiSuccess({ script: rowToSavedScript(updated) });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { scriptId: scriptIdParam } = await context.params;
  const route = await resolveOwnedScriptRoute(guard.ctx.userId, scriptIdParam);
  if (!route.ok) return route.response;

  const { userId, scriptId } = route;

  await db
    .delete(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)));

  return apiSuccess({ deleted: true });
}
