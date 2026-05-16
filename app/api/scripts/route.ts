import { desc, eq } from 'drizzle-orm';
import { scripts } from '@/drizzle/schema';
import { db, ensureDbUserForClerkId, getDbUserIdByClerk, rowToSavedScript } from '@/lib/db';
import { requireClerkSession } from '@/lib/auth/require-clerk-session';
import { MAX_HISTORY_ENTRIES } from '@/lib/config/constants';
import { createScriptSchema } from '@/lib/api/validation';

export async function GET() {
  const session = await requireClerkSession();
  if (!session.ok) return session.response;

  const userId = await getDbUserIdByClerk(session.userId);
  if (userId == null) {
    return Response.json({ scripts: [] });
  }

  const rows = await db
    .select()
    .from(scripts)
    .where(eq(scripts.userId, userId))
    .orderBy(desc(scripts.createdAt))
    .limit(MAX_HISTORY_ENTRIES);

  return Response.json({ scripts: rows.map(rowToSavedScript) });
}

export async function POST(req: Request) {
  const session = await requireClerkSession();
  if (!session.ok) return session.response;

  const userId = await ensureDbUserForClerkId(session.userId);

  const body: unknown = await req.json().catch(() => null);
  const parsed = createScriptSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { title, content, version, parentId, model, accountBalance, metadata } =
    parsed.data;

  const [created] = await db
    .insert(scripts)
    .values({
      userId,
      title,
      content,
      version,
      parentId: parentId ?? null,
      model: model ?? null,
      accountBalance: accountBalance ?? null,
      metadata,
    })
    .returning();

  if (!created) {
    return Response.json({ error: 'Failed to save script' }, { status: 500 });
  }

  return Response.json({ script: rowToSavedScript(created) });
}
