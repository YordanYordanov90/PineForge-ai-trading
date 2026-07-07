import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import { normalizeAlertTemplatesOutput } from '@/lib/api/alert-templates-normalize';
import { alertTemplatesRequestSchema, alertTemplatesLlmResultSchema } from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { ALERT_TEMPLATES_SYSTEM } from '@/lib/ai/prompts/alert-templates';
import { ALERT_TEMPLATES_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import { devWarn } from '@/lib/dev-log';

function buildAlertTemplatesUserPrompt(data: {
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

Generate four webhook JSON alert message templates (3Commas, Alertatron, WunderTrading, Custom). Use placeholders for secrets and IDs. Templates are pasted into TradingView alert message fields only.`;
}



export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = alertTemplatesRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, parsed.data.model);
  if (!entitlement.ok) {
    return apiError(entitlement.message, 403);
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const userPrompt = buildAlertTemplatesUserPrompt(parsed.data);

  try {
    const { object } = await generateObject({
      model: xai(entitlement.model),
      schema: alertTemplatesLlmResultSchema,
      system: ALERT_TEMPLATES_SYSTEM,
      prompt: userPrompt,
      temperature: 0.2,
      maxOutputTokens: ALERT_TEMPLATES_MAX_OUTPUT_TOKENS,
      abortSignal: guard.ctx.req.signal,
    });

    const normalized = normalizeAlertTemplatesOutput(object);
    if (!normalized) {
      return apiError(
        'Alert templates could not be validated. Please try again.',
        502,
      );
    }

    return apiSuccess(normalized);
  } catch (error) {
    devWarn('[alert-templates] generateObject failed', error);
    return apiError('Failed to generate alert templates. Please try again.', 500);
  }
}
