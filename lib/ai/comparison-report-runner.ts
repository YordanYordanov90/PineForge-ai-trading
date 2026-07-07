import 'server-only';
import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import {
  comparisonReportLlmSchema,
  comparisonReportSchema,
  type ComparisonReportLlm,
} from '@/lib/api/validation';
import { buildComparisonReportUserPrompt } from '@/lib/ai/prompts/comparison-report';
import { createComparisonReport } from '@/lib/db';
import { COMPARISON_REPORT_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import { devWarn } from '@/lib/dev-log';
import type {
  GrokModelId,
  SavedComparisonReport,
  SavedScript,
} from '@/lib/types';

type GenerateAndSaveParams = {
  dbUserId: number;
  scriptIds: number[];
  ownedScripts: SavedScript[];
  model: GrokModelId;
};

/**
 * Runs the LLM comparison-report generation against the strict schema, then
 * persists the result. If the strict re-validation fails, we fall back to the
 * loose object (whose shape is already guaranteed by generateObject + the LLM
 * schema) and surface a warning only in development. The thrown errors are
 * caught and translated by the calling route.
 */
export async function generateAndSaveComparisonReport({
  dbUserId,
  scriptIds,
  ownedScripts,
  model,
}: GenerateAndSaveParams): Promise<SavedComparisonReport> {
  const { object: llmObject } = await generateObject({
    model: xai(model),
    schema: comparisonReportLlmSchema,
    prompt: buildComparisonReportUserPrompt(ownedScripts),
    temperature: 0.2,
    maxOutputTokens: COMPARISON_REPORT_MAX_OUTPUT_TOKENS,
  });

  const validated = comparisonReportSchema.safeParse(llmObject);
  const data: ComparisonReportLlm = validated.success
    ? validated.data
    : (logLooseFallback(validated.error.issues), llmObject as ComparisonReportLlm);

  return createComparisonReport(dbUserId, data.title, scriptIds, data);
}

function logLooseFallback(issues: unknown): void {
  devWarn('[comparison-report] strict validation failed', issues);
}
