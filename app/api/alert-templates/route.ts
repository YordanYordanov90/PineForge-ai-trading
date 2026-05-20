import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import { normalizeAlertTemplatesOutput } from '@/lib/api/alert-templates-normalize';
import { alertTemplatesRequestSchema, alertTemplatesLlmResultSchema } from '@/lib/api/validation';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { ALERT_TEMPLATES_SYSTEM } from '@/lib/ai/prompts/alert-templates';
import { ALERT_TEMPLATES_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';

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
    return Response.json(
      { success: false, data: null, error: 'Invalid request.' },
      { status: 400 },
    );
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, parsed.data.model);
  if (!entitlement.ok) {
    return Response.json(
      { success: false, data: null, error: entitlement.message },
      { status: 403 },
    );
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
      if (process.env.NODE_ENV === 'development') {
        console.warn('[alert-templates] normalize failed', { object });
      }
      return Response.json(
        {
          success: false,
          data: null,
          error: 'Alert templates could not be validated. Please try again.',
        },
        { status: 502 },
      );
    }

    return Response.json({
      success: true,
      data: normalized,
      error: null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[alert-templates] generateObject failed', error);
    }
    return Response.json(
      {
        success: false,
        data: null,
        error: 'Failed to generate alert templates. Please try again.',
      },
      { status: 500 },
    );
  }
}
