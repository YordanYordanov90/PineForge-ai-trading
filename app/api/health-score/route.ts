import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import { and, eq } from 'drizzle-orm';
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
import { db, getDbUserIdByClerk } from '@/lib/db';
import { scripts } from '@/drizzle/schema';
import { mergeScriptMetadata } from '@/lib/db/script-mapper';

function buildHealthScoreUserPrompt(data: {
  prompt: string;
  script: string;
  balance?: string | null;
  market?: string | null;
  timeframe?: string | null;
  direction?: string | null;
  indicators?: string[];
  assumptions?: { items?: string[]; raw?: string } | null;
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

  let assumptionsBlock = '';
  if (data.assumptions?.items?.length) {
    assumptionsBlock = `\n\nStrategy assumptions (cross-reference for contradictions):\n${data.assumptions.items.map((i) => `- ${i}`).join('\n')}`;
  } else if (data.assumptions?.raw) {
    assumptionsBlock = `\n\nStrategy assumptions (cross-reference for contradictions):\n${data.assumptions.raw}`;
  }

  return `Original strategy intent:
${data.prompt}
${contextBlock}${assumptionsBlock}

Generated Pine Script v5:
\`\`\`pine
${data.script}
\`\`\`

Review the intent against the script. Score structural quality only. If assumptions are provided, explicitly flag any logic that contradicts the stated assumptions.`;
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

    // Spec 65 prereq: if scriptId provided and owned by caller, persist the full
    // result into scripts.metadata.healthScore (jsonb, no migration). This powers
    // the Quality Progression dashboard without new tables or columns.
    if (parsed.data.scriptId != null) {
      const dbUserId = await getDbUserIdByClerk(guard.ctx.userId);
      if (dbUserId != null) {
        const [owned] = await db
          .select({ id: scripts.id, metadata: scripts.metadata })
          .from(scripts)
          .where(
            and(
              eq(scripts.id, parsed.data.scriptId),
              eq(scripts.userId, dbUserId),
            ),
          )
          .limit(1);
        if (owned) {
          const updated = mergeScriptMetadata(owned.metadata, {
            healthScore: validated.data,
          });
          await db
            .update(scripts)
            .set({ metadata: updated, updatedAt: new Date() })
            .where(eq(scripts.id, owned.id));
        }
      }
    }

    return apiSuccess(validated.data);
  } catch {
    return apiError('Failed to analyze strategy health. Please try again.', 500);
  }
}
