import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { refineScriptSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest } from '@/lib/api/envelope';
import { jsonApiError, protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { DEFAULT_MODEL, REFINE_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts/pine-generate-system';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import { acquireStreamLock } from '@/lib/rate-limit/concurrency';

const schema = refineScriptSchema.extend({
  model: refineScriptSchema.shape.model.default(DEFAULT_MODEL),
});

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, parsed.data.model);
  if (!entitlement.ok) {
    return jsonApiError(403, entitlement.message);
  }

  const lock = await acquireStreamLock(guard.ctx.userId);
  if (!lock.acquired) {
    return jsonApiError(409, 'A generation is already in progress.');
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) {
    await lock.release();
    return missingKey;
  }

  const { script, instruction } = parsed.data;

  const refineUserPrompt = `You are refining an existing Pine Script v5 script. Apply the user's instructions and return the complete updated script only (same output rules as a fresh generation).

Current script:
${script}

User instructions:
${instruction}`;

  try {
    const result = streamText({
      model: xai(entitlement.model),
      system: PINE_GENERATE_SYSTEM_PROMPT,
      prompt: refineUserPrompt,
      temperature: 0.1,
      maxOutputTokens: REFINE_MAX_OUTPUT_TOKENS,
      abortSignal: guard.ctx.req.signal,
      onFinish: () => {
        void lock.release();
      },
    });

    return result.toTextStreamResponse();
  } catch {
    await lock.release();
    return apiError('Failed to refine script. Please try again.', 500);
  }
}
