import { scripts } from '@/drizzle/schema';
import {
  db,
  ensureDbUserForClerkId,
  getDbUserIdByClerk,
  listScriptsForUser,
  rowToSavedScript,
} from '@/lib/db';
import { createScriptSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';

export async function GET() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return apiSuccess({ scripts: [] });
  }

  const rows = await listScriptsForUser(userId);

  return apiSuccess({ scripts: rows.map(rowToSavedScript) });
}

export async function POST(req: Request) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const userId = await ensureDbUserForClerkId(guard.ctx.userId);

  const body: unknown = await req.json().catch(() => null);
  const parsed = createScriptSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
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
    return apiError('Failed to save script', 500);
  }

  return apiSuccess({ script: rowToSavedScript(created) });
}
