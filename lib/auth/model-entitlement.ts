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
