import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { generateSchema } from '@/lib/api/validation';
import { jsonApiError, protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { DEFAULT_MODEL } from '@/lib/config/constants';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts/pine-generate-system';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import { acquireStreamLock } from '@/lib/rate-limit/concurrency';

const schema = generateSchema.extend({
  model: generateSchema.shape.model.default(DEFAULT_MODEL),
});

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
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

  const {
    prompt: strategy,
    balance,
    market,
    timeframe,
    direction,
    indicators,
    rr,
  } = parsed.data;

  const contextParts: string[] = [];
  if (market) contextParts.push(`Market: ${market}`);
  if (timeframe) contextParts.push(`Timeframe: ${timeframe}`);
  if (direction) contextParts.push(`Direction: ${direction}`);
  if (indicators?.length)
    contextParts.push(`Preferred indicators: ${indicators.join(', ')}`);
  if (rr) contextParts.push(`Risk-Reward ratio: ${rr}:1`);

  const contextBlock = contextParts.length
    ? `\n\nAdditional context: ${contextParts.join('; ')}`
    : '';

  try {
    const result = streamText({
      model: xai(entitlement.model),
      system: PINE_GENERATE_SYSTEM_PROMPT,
      prompt: `Strategy description: ${strategy}\nAccount balance: ${balance}${contextBlock}`,
      temperature: 0.1,
      maxOutputTokens: 900,
      abortSignal: guard.ctx.req.signal,
      onFinish: () => {
        void lock.release();
      },
    });

    return result.toTextStreamResponse();
  } catch {
    await lock.release();
    return Response.json(
      { error: 'Failed to generate script. Please try again.' },
      { status: 500 },
    );
  }
}
