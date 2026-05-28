import { and, desc, eq, inArray } from 'drizzle-orm';
import { comparisonReports, scripts } from '@/drizzle/schema';
import { db } from './client';
import { rowToSavedScript } from './script-mapper';
import type { ComparisonReportData, SavedComparisonReport, SavedScript } from '@/lib/types';

type ComparisonReportRow = typeof comparisonReports.$inferSelect;

/**
 * Loads 2–3 scripts by ID, enforcing ownership by userId.
 * Returns the scripts in the order requested (or subset if some missing).
 * Used by POST /api/comparison-reports before the LLM call.
 */
export async function getScriptsByIds(
  userId: number,
  scriptIds: number[],
): Promise<SavedScript[]> {
  if (scriptIds.length === 0) return [];
  const rows = await db
    .select()
    .from(scripts)
    .where(
      and(
        eq(scripts.userId, userId),
        inArray(scripts.id, scriptIds),
      ),
    );
  // Preserve caller-specified order for prompt determinism
  const byId = new Map(rows.map((r) => [r.id, rowToSavedScript(r)]));
  return scriptIds
    .map((id) => byId.get(id))
    .filter((s): s is SavedScript => Boolean(s));
}

/** Maps a DB row to the client-facing SavedComparisonReport (omits internal userId). */
function rowToSavedComparisonReport(row: ComparisonReportRow): SavedComparisonReport {
  return {
    id: row.id,
    title: row.title,
    scriptIds: row.scriptIds,
    report: row.report as ComparisonReportData,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Creates a new comparison report row. Returns the saved record. */
export async function createComparisonReport(
  userId: number,
  title: string,
  scriptIds: number[],
  report: ComparisonReportData,
): Promise<SavedComparisonReport> {
  const [row] = await db
    .insert(comparisonReports)
    .values({
      userId,
      title,
      scriptIds,
      report,
      createdAt: new Date(),
    })
    .returning();
  if (!row) {
    throw new Error('Failed to create comparison report');
  }
  return rowToSavedComparisonReport(row);
}

/** Lists all comparison reports for the user, newest first. */
export async function listComparisonReportsForUser(
  userId: number,
): Promise<SavedComparisonReport[]> {
  const rows = await db
    .select()
    .from(comparisonReports)
    .where(eq(comparisonReports.userId, userId))
    .orderBy(desc(comparisonReports.createdAt));
  return rows.map(rowToSavedComparisonReport);
}

/** Fetches a single report with ownership check. Returns null if missing/foreign. */
export async function getComparisonReportForUser(
  userId: number,
  reportId: number,
): Promise<SavedComparisonReport | null> {
  const [row] = await db
    .select()
    .from(comparisonReports)
    .where(
      and(
        eq(comparisonReports.id, reportId),
        eq(comparisonReports.userId, userId),
      ),
    )
    .limit(1);
  return row ? rowToSavedComparisonReport(row) : null;
}

/** Deletes a report with ownership check. Returns true if deleted. */
export async function deleteComparisonReportForUser(
  userId: number,
  reportId: number,
): Promise<boolean> {
  const result = await db
    .delete(comparisonReports)
    .where(
      and(
        eq(comparisonReports.id, reportId),
        eq(comparisonReports.userId, userId),
      ),
    );
  return (result.rowCount ?? 0) > 0;
}
