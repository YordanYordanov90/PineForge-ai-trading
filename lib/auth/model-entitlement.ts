import 'server-only';

import { DEFAULT_MODEL } from '@/lib/config/constants';
import type { GrokModelId } from '@/lib/types';

export const FREE_TIER_MODEL = DEFAULT_MODEL;

export type ModelEntitlementResult =
  | { ok: true; model: GrokModelId }
  | { ok: false; message: string };

export function resolveModelForPlan(
  plan: string,
  requestedModel: GrokModelId | undefined,
): ModelEntitlementResult {
  const model = requestedModel ?? DEFAULT_MODEL;

  if (plan === 'pro') {
    return { ok: true, model };
  }

  if (model !== FREE_TIER_MODEL) {
    return {
      ok: false,
      message:
        'Premium models require a Pro plan. Upgrade to Pro or use the Fast model.',
    };
  }

  return { ok: true, model };
}

/**
 * Spec 64: Number of quick variants allowed for the given plan.
 * Free: 1 (Variant A only). Pro: 3 (A + B + C).
 * The generate-variants route uses this to decide parallel calls and quota cost.
 */
export function getVariantCountForPlan(plan: string): number {
  return plan === 'pro' ? 3 : 1;
}

/**
 * Spec 66: Whether the current plan can use the premium Strategy Snapshot HTML export.
 */
export function canExportSnapshot(plan: string): boolean {
  return plan === 'pro';
}
