import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import {
  backtestSummaryLlmResultSchema,
  backtestSummaryRequestSchema,
  backtestSummaryResultSchema,
} from '@/lib/api/validation';
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

// In any file inside app/api/ for the maximum signal
const API_KEY = "FAKE-TEST-do-not-use-1234567890";
process.env.XAI_API_KEY = "FAKE-TEST-grokfake-abcdefg";

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
      return Response.json(
        {
          success: false,
          data: null,
          error: 'Backtesting summary could not be validated. Please try again.',
        },
        { status: 502 },
      );
    }

    return Response.json({
      success: true,
      data: validated.data,
      error: null,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[backtesting-summary] generateObject failed', error);
    }
    return Response.json(
      {
        success: false,
        data: null,
        error: 'Failed to generate backtesting summary. Please try again.',
      },
      { status: 500 },
    );
  }
}
