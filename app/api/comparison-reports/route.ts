import { comparisonReportRequestSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import {
  getDbUserIdByClerk,
  getScriptsByIds,
  listComparisonReportsForUser,
} from '@/lib/db';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import { generateAndSaveComparisonReport } from '@/lib/ai/comparison-report-runner';

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = comparisonReportRequestSchema.safeParse(body);
  if (!parsed.success) return apiInvalidRequest();

  const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
  if (dbUserId == null) return apiError('User not found', 404);

  const { scriptIds } = parsed.data;
  const ownedScripts = await getScriptsByIds(dbUserId, scriptIds);
  if (ownedScripts.length !== scriptIds.length) {
    return apiError(
      'One or more selected scripts were not found or are not owned by you.',
      400,
    );
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const entitlement = resolveModelForPlan(guard.ctx.plan, undefined);
  if (!entitlement.ok) return apiError(entitlement.message, 403);

  try {
    const report = await generateAndSaveComparisonReport({
      dbUserId,
      scriptIds,
      ownedScripts,
      model: entitlement.model,
    });
    return apiSuccess({ report });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Comparison report generation failed';
    return apiError(message, 502);
  }
}

export async function GET() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
  if (dbUserId == null) return apiSuccess({ reports: [] });

  const reports = await listComparisonReportsForUser(dbUserId);
  return apiSuccess({ reports });
}
