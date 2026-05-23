import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import {
  healthScoreRequestSchema,
  healthScoreResultSchema,
} from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { HEALTH_SCORE_SYSTEM } from '@/lib/ai/prompts/health-score';
import { HEALTH_SCORE_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';

function buildHealthScoreUserPrompt(data: {
  prompt: string;
  script: string;
  balance?: string | null;
  market?: string | null;
  timeframe?: string | null;
  direction?: string | null;
  indicators?: string[];
}): string {
  const contextParts: string[] = [];
  if (data.market) contextParts.push(`Market: ${data.market}`);
  if (data.timeframe) contextParts.push(`Timeframe: ${data.timeframe}`);
  if (data.direction) contextParts.push(`Direction: ${data.direction}`);
  if (data.indicators?.length) {
    contextParts.push(`Indicators: ${data.indicators.join(', ')}`);
  }
  if (data.balance) contextParts.push(`Account balance: ${data.balance}`);

  const contextBlock = contextParts.length
    ? `\n\nStrategy context:\n${contextParts.join('\n')}`
    : '';

  return `Original strategy intent:
${data.prompt}
${contextBlock}

Generated Pine Script v5:
\`\`\`pine
${data.script}
\`\`\`

Review the intent against the script. Score structural quality only.`;
}

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = healthScoreRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, parsed.data.model);
  if (!entitlement.ok) {
    return apiError(entitlement.message, 403);
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const userPrompt = buildHealthScoreUserPrompt(parsed.data);

  try {
    const { object } = await generateObject({
      model: xai(entitlement.model),
      schema: healthScoreResultSchema,
      system: HEALTH_SCORE_SYSTEM,
      prompt: userPrompt,
      temperature: 0.2,
      maxOutputTokens: HEALTH_SCORE_MAX_OUTPUT_TOKENS,
      abortSignal: guard.ctx.req.signal,
    });

    const validated = healthScoreResultSchema.safeParse(object);
    if (!validated.success) {
      return apiError(
        'Health score could not be validated. Please try again.',
        502,
      );
    }

    return apiSuccess(validated.data);
  } catch {
    return apiError('Failed to analyze strategy health. Please try again.', 500);
  }
}
