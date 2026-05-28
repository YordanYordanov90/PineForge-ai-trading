import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import {
  comparisonReportRequestSchema,
  comparisonReportLlmSchema,
  comparisonReportSchema,
  type ComparisonReportLlm,
} from '@/lib/api/validation';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { protectDataRoute } from '@/lib/api/protected-data-route';
import { resolveModelForPlan } from '@/lib/auth/model-entitlement';
import { getDbUserIdByClerk } from '@/lib/db';
import {
  getScriptsByIds,
  createComparisonReport,
  listComparisonReportsForUser,
} from '@/lib/db';
import { buildComparisonReportUserPrompt } from '@/lib/ai/prompts/comparison-report';
import { COMPARISON_REPORT_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = comparisonReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const { scriptIds } = parsed.data;

  const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
  if (dbUserId == null) {
    return apiError('User not found', 404);
  }

  const ownedScripts = await getScriptsByIds(dbUserId, scriptIds);
  if (ownedScripts.length !== scriptIds.length) {
    return apiError('One or more selected scripts were not found or are not owned by you.', 400);
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const userPrompt = buildComparisonReportUserPrompt(ownedScripts);
  const entitlement = resolveModelForPlan(guard.ctx.plan, undefined);
  if (!entitlement.ok) {
    return apiError(entitlement.message, 403);
  }

  try {
    const { object: llmObject } = await generateObject({
      model: xai(entitlement.model),
      schema: comparisonReportLlmSchema,
      prompt: userPrompt,
      temperature: 0.2,
      maxOutputTokens: COMPARISON_REPORT_MAX_OUTPUT_TOKENS,
    });

    const validated = comparisonReportSchema.safeParse(llmObject);
    if (!validated.success) {
      // Dev-only visibility; never leak to client
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[comparison-report] strict validation failed', validated.error.issues);
      }
      // Fall back to the loose object (shape guaranteed by generateObject + llm schema)
      const llm = llmObject as ComparisonReportLlm;
      const saved = await createComparisonReport(
        dbUserId,
        llm.title,
        scriptIds,
        llm,
      );
      return apiSuccess({ report: saved });
    }

    const saved = await createComparisonReport(
      dbUserId,
      validated.data.title,
      scriptIds,
      validated.data,
    );
    return apiSuccess({ report: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Comparison report generation failed';
    return apiError(message, 502);
  }
}

export async function GET() {
  const guard = await protectDataRoute();
  if (!guard.ok) return guard.response;

  const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
  if (dbUserId == null) {
    return apiSuccess({ reports: [] });
  }

  const reports = await listComparisonReportsForUser(dbUserId);
  return apiSuccess({ reports });
}
