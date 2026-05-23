import { collections } from '@/drizzle/schema';
import {
  db,
  ensureDbUserForClerkId,
  findUserCollectionByNameInsensitive,
  getDbUserIdByClerk,
  listCollectionsForUser,
  rowToSavedCollection,
} from '@/lib/db';
import { createCollectionSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { normalizeCollectionName } from '@/lib/collections/collections';

export async function GET() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return apiSuccess({ collections: [] });
  }

  const rows = await listCollectionsForUser(userId);

  return apiSuccess({ collections: rows.map(rowToSavedCollection) });
}

export async function POST(req: Request) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const userId = await ensureDbUserForClerkId(guard.ctx.userId);

  const body: unknown = await req.json().catch(() => null);
  const parsed = createCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const normalized = normalizeCollectionName(parsed.data.name);
  if (normalized == null) {
    return apiError('Collection name is required', 400);
  }

  const conflict = await findUserCollectionByNameInsensitive(userId, normalized);
  if (conflict) {
    return apiError('A collection with this name already exists.', 409);
  }

  const [created] = await db
    .insert(collections)
    .values({ userId, name: normalized })
    .returning();

  if (!created) {
    return apiError('Failed to create collection', 500);
  }

  return apiSuccess({ collection: rowToSavedCollection(created) });
}
