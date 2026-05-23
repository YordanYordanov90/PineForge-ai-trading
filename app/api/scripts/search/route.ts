import {
  getDbUserIdByClerk,
  rowToSavedScript,
  searchScriptsForUser,
} from '@/lib/db';
import { searchScriptsQuerySchema } from '@/lib/api/validation';
import { apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { normalizeTags } from '@/lib/scripts/tags';

export async function GET(req: Request) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const raw = {
    q: url.searchParams.get('q') ?? undefined,
    tag: url.searchParams.getAll('tag'),
    starred: url.searchParams.get('starred') ?? undefined,
    collectionId: url.searchParams.get('collectionId') ?? undefined,
  };

  const parsed = searchScriptsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return apiSuccess({ scripts: [] });
  }

  const q =
    parsed.data.q && parsed.data.q.length > 0 ? parsed.data.q : undefined;

  const expandedTags = parsed.data.tag.flatMap((value) => value.split(','));
  const normalizedTags = normalizeTags(expandedTags);

  const starred =
    parsed.data.starred === 'true'
      ? true
      : parsed.data.starred === 'false'
        ? false
        : undefined;

  const collectionId = parsed.data.collectionId
    ? Number.parseInt(parsed.data.collectionId, 10)
    : undefined;

  const rows = await searchScriptsForUser(userId, {
    q,
    tags: normalizedTags.length > 0 ? normalizedTags : undefined,
    starred,
    collectionId,
  });

  return apiSuccess({ scripts: rows.map(rowToSavedScript) });
}
