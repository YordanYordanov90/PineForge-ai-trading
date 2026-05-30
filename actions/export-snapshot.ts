'use server';

import { auth } from '@clerk/nextjs/server';
import { getUserPlanByClerkId } from '@/lib/db/scripts-user';
import {
  assembleStrategySnapshotHtml,
  type StrategySnapshotOptions,
} from '@/lib/export/strategy-snapshot-html';
import type { StrategyExportSource } from '@/lib/export/source';
import { canExportSnapshot } from '@/lib/auth/model-entitlement';

/**
 * Spec 66 Server Action — returns a self-contained HTML snapshot string.
 * Pro-only (checked server-side for defense in depth). No DB write, no AI.
 * Client receives { success, data: { html } } and triggers downloadBlob.
 */
export async function exportStrategySnapshot(
  source: StrategyExportSource,
  options: StrategySnapshotOptions = {},
): Promise<{ success: boolean; data: { html: string } | null; error: string | null }> {
  try {
    // Server-side Pro enforcement (UI also gates; this blocks direct calls)
    const { userId: clerkId } = await auth();
    const plan = await getUserPlanByClerkId(clerkId);
    if (!canExportSnapshot(plan)) {
      return {
        success: false,
        data: null,
        error: 'Strategy Snapshot export is a Pro-only feature. Upgrade to unlock.',
      };
    }

    // Basic shape guard (no full Zod to keep surface tiny — content is user-owned)
    if (!source || typeof source.script !== 'string' || source.script.trim().length === 0) {
      return { success: false, data: null, error: 'No script content to export.' };
    }

    const html = await assembleStrategySnapshotHtml(source, options);
    return { success: true, data: { html }, error: null };
  } catch (err) {
    // Never leak stack or raw errors to client
    return {
      success: false,
      data: null,
      error: 'Failed to generate snapshot. Please try again.',
    };
  }
}
