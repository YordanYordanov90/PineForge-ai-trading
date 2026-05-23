import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import {
  backtestSummaryLlmResultSchema,
  backtestSummaryRequestSchema,
  backtestSummaryResultSchema,
} from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import {
  BACKTEST_SUMMARY_SYSTEM,
  buildBacktestSummaryUserPrompt,
} from '@/lib/ai/prompts/backtest-summary';
import { assembleBacktestSummaryMarkdown } from '@/lib/ai/backtest-summary-markdown';
import { BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = backtestSummaryRequestSchema.safeParse(body);



  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const entitlement = resolveModelForPlan(guard.ctx.plan, parsed.data.model);
  if (!entitlement.ok) {
    return apiError(entitlement.message, 403);
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const userPrompt = buildBacktestSummaryUserPrompt(parsed.data);

  try {
    const { object } = await generateObject({
      model: xai(entitlement.model),
      schema: backtestSummaryLlmResultSchema,
      system: BACKTEST_SUMMARY_SYSTEM,
      prompt: userPrompt,
      temperature: 0.2,
      maxOutputTokens: BACKTEST_SUMMARY_MAX_OUTPUT_TOKENS,
      abortSignal: guard.ctx.req.signal,
    });

    const markdown = assembleBacktestSummaryMarkdown(object.sections);

    const validated = backtestSummaryResultSchema.safeParse({
      title: object.title,
      markdown,
      sections: object.sections,
    });

    if (!validated.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[backtesting-summary] strict validation failed', {
          issues: validated.error.issues,
        });
      }
      return apiError(
        'Backtesting summary could not be validated. Please try again.',
        502,
      );
    }

    return apiSuccess(validated.data);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[backtesting-summary] generateObject failed', error);
    }
    return apiError('Failed to generate backtesting summary. Please try again.', 500);
  }
}
