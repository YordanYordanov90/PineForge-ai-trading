import { and, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db, getDbUserIdByClerk, rowToSavedScript } from '@/lib/db';
import { requireClerkSession } from '@/lib/auth/require-clerk-session';
import { renameScriptSchema } from '@/lib/api/validation';

type RouteContext = { params: Promise<{ scriptId: string }> };

function parseScriptId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 1) return null;
  return id;
}

export async function PATCH(req: Request, context: RouteContext) {
  const session = await requireClerkSession();
  if (!session.ok) return session.response;

  const { scriptId: scriptIdParam } = await context.params;
  const scriptId = parseScriptId(scriptIdParam);
  if (scriptId == null) {
    return Response.json({ error: 'Invalid script id' }, { status: 400 });
  }

  const userId = await getDbUserIdByClerk(session.userId);
  if (userId == null) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = renameScriptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [updated] = await db
    .update(scripts)
    .set({ title: parsed.data.title, updatedAt: new Date() })
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .returning();

  if (!updated) {
    return Response.json({ error: 'Failed to update script' }, { status: 500 });
  }

  return Response.json({ script: rowToSavedScript(updated) });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await requireClerkSession();
  if (!session.ok) return session.response;

  const { scriptId: scriptIdParam } = await context.params;
  const scriptId = parseScriptId(scriptIdParam);
  if (scriptId == null) {
    return Response.json({ error: 'Invalid script id' }, { status: 400 });
  }

  const userId = await getDbUserIdByClerk(session.userId);
  if (userId == null) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: scripts.id })
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);

  if (!existing) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .delete(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)));

  return Response.json({ ok: true });
}
