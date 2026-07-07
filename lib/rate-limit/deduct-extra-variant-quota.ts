import { jsonApiError } from '@/lib/api/protected-ai-route';
import {
  freeUserRatelimit,
  proUserRatelimit,
} from '@/lib/rate-limit/upstash';

type DeductExtraVariantQuotaResult =
  | { ok: true }
  | { ok: false; response: Response };

/**
 * Consumes additional daily quota slots for variant generations beyond the
 * single slot already deducted by `protectAiRoute`.
 */
export async function deductExtraVariantQuota(
  userId: string,
  plan: string,
  variantCount: number,
): Promise<DeductExtraVariantQuotaResult> {
  const limiter = plan === 'pro' ? proUserRatelimit : freeUserRatelimit;

  for (let i = 1; i < variantCount; i += 1) {
    const extra = await limiter.limit(userId);
    if (!extra.success) {
      return {
        ok: false,
        response: jsonApiError(
          429,
          plan === 'pro'
            ? 'Daily limit reached. Try again tomorrow.'
            : 'Free tier limit reached (3 AI requests/day). Upgrade to Pro for unlimited access.',
          extra.reset
            ? { 'Retry-After': String(Math.ceil((extra.reset - Date.now()) / 1000)) }
            : undefined,
        ),
      };
    }
  }

  return { ok: true };
}