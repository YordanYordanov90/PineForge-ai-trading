import { apiSuccess } from '@/lib/api/envelope';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { getDbUserIdByClerk } from '@/lib/db';
import { getProgressStats } from '@/lib/db/progress-stats';

export async function GET() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
  if (dbUserId == null) {
    // No DB user yet — return empty but valid shape so UI can render empty states cleanly
    return apiSuccess({
      weeklyHealthScores: [],
      topRiskThemes: [],
      avgRefinementDepth: 0,
      mostRefinedScripts: [],
      memoryInsights: [],
      totalScripts: 0,
      totalScoredScripts: 0,
      scriptsThisMonth: 0,
      scriptsLastMonth: 0,
      highestScore: null,
    });
  }

  const stats = await getProgressStats(dbUserId);
  return apiSuccess(stats);
}
