import { apiError, apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { getDbUserIdByClerk, deleteComparisonReportForUser } from '@/lib/db';

type RouteContext = { params: Promise<{ reportId: string }> };

function parseReportId(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function DELETE(_req: Request, context: RouteContext) {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const { reportId: rawId } = await context.params;
  const reportId = parseReportId(rawId);
  if (reportId == null) {
    return apiError('Invalid report id', 400);
  }

  const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
  if (dbUserId == null) {
    return apiError('User not found', 404);
  }

  const deleted = await deleteComparisonReportForUser(dbUserId, reportId);
  if (!deleted) {
    // Either not found or not owned — do not leak which
    return apiError('Report not found', 404);
  }

  return apiSuccess({ deleted: true });
}
