import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts/pine-generate-system';
import { generateVariantsRequestSchema } from '@/lib/api/validation';
import { apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute, jsonApiError } from '@/lib/api/protected-ai-route';
import { getVariantCountForPlan, resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import { buildVariantUserPrompt, VARIANT_DEFINITIONS, VARIANT_AXES, type VariantAxis } from '@/lib/ai/prompts/variants';
import { deductExtraVariantQuota } from '@/lib/rate-limit/deduct-extra-variant-quota';

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = generateVariantsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, parsed.data.model);
  if (!entitlement.ok) {
    return jsonApiError(403, entitlement.message);
  }

  const variantCount = getVariantCountForPlan(guard.ctx.plan);

  const quota = await deductExtraVariantQuota(
    guard.ctx.userId,
    guard.ctx.plan,
    variantCount,
  );
  if (!quota.ok) return quota.response;

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const { prompt, script, balance, structuredInputs } = parsed.data;

  // Select the axes for this plan (A for free, A+B+C for pro)
  const axesToRun: VariantAxis[] = VARIANT_AXES.slice(0, variantCount);

  // Normalize nullable fields from wire schema to the builder's expected shape
  const normalizedInputs = {
    market: structuredInputs.market ?? undefined,
    timeframe: structuredInputs.timeframe ?? undefined,
    direction: structuredInputs.direction ?? undefined,
    indicators: structuredInputs.indicators ?? undefined,
    rr: structuredInputs.rr ?? undefined,
  };

  // Fire parallel (non-streaming) generations. Use allSettled so one failure
  // does not block the others — partial results are valid per spec.
  const settled = await Promise.allSettled(
    axesToRun.map(async (axis) => {
      const def = VARIANT_DEFINITIONS[axis];
      const userPrompt = buildVariantUserPrompt({
        prompt,
        script,
        balance: balance ?? null,
        structuredInputs: normalizedInputs,
        modifier: def.modifier,
      });

      const { text } = await generateText({
        model: xai(entitlement.model),
        system: PINE_GENERATE_SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.1,
        maxOutputTokens: 900,
      });

      return {
        axis,
        label: def.label,
        script: text.trim(),
        prompt: userPrompt,
      };
    }),
  );

  const variants = settled
    .filter((r): r is PromiseFulfilledResult<{ axis: VariantAxis; label: string; script: string; prompt: string }> => r.status === 'fulfilled')
    .map((r) => r.value);

  // Return whatever succeeded (0 is technically valid but UX should prevent empty trigger)
  return apiSuccess({ variants });
}
