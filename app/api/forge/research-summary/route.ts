import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import { apiError, apiInvalidRequest, apiSuccess } from '@/lib/api/envelope';
import { protectAiRoute } from '@/lib/api/protected-ai-route';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import {
  getConversationForUser,
  getDbUserIdByClerk,
} from '@/lib/db';
import {
  researchSummaryPayloadSchema,
  researchSummaryRequestSchema,
} from '@/lib/api/validation';
import type { ResearchSummaryPayload } from '@/lib/api/validation';
import { devWarn } from '@/lib/dev-log';

/**
 * Research summarisation endpoint (spec 61).
 *
 * POST /api/forge/research-summary
 * Body: { conversationId }
 *
 * Guardrails:
 *  - protectAiRoute (auth + rate limit + plan) — charges one AI quota unit
 *  - Input validated; only conversationId accepted from client
 *  - Messages loaded server-side via owner-scoped DB query (no client injection)
 *  - Output validated with Zod `researchSummaryPayloadSchema` before return
 *
 * The model is prompted to produce a concise, structured handoff payload
 * suitable for pre-filling the /generate form + storing as traceability notes.
 */
export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = researchSummaryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiInvalidRequest();
  }

  const { conversationId } = parsed.data;

  const userId = await getDbUserIdByClerk(guard.ctx.userId);
  if (userId == null) {
    return apiError('User not found', 404);
  }

  const conversation = await getConversationForUser(userId, conversationId);
  if (!conversation) {
    return apiError('Conversation not found', 404);
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  // Build a compact transcript (text only; tool calls are summarised lightly)
  const transcriptLines: string[] = [];
  for (const m of conversation.messages) {
    const role = m.role.toUpperCase();
    const text = (m.content || '').trim();
    if (text) {
      transcriptLines.push(`${role}: ${text}`);
    }
    if (m.toolCalls?.length) {
      const names = m.toolCalls.map((t) => t.name).join(', ');
      transcriptLines.push(`${role} [tools: ${names}]`);
    }
  }
  const transcript = transcriptLines.join('\n\n').slice(0, 12000); // safety cap

  const summariserSystem = `You are a precise, conservative trading-strategy research summariser.
You read a Forge research conversation and output a single structured JSON object matching the provided schema.
Never invent indicators, markets, or timeframes that were not discussed or logically implied by the thread.
Keep description and researchNotes factual and concise. Use the exact section guidance from the research prompt if present.`;

  const userPrompt = `Conversation transcript (research thread):\n\n${transcript || '(no text content yet)'}\n\nProduce the ResearchSummaryPayload now. Focus on extracting a usable generator description and the supporting structured fields.`;

  try {
    const { object } = await generateObject({
      model: xai('grok-4-1-fast-reasoning'),
      schema: researchSummaryPayloadSchema,
      system: summariserSystem,
      prompt: userPrompt,
      temperature: 0.2,
      maxOutputTokens: 1200,
    });

    // Final runtime validation (defensive)
    const validated = researchSummaryPayloadSchema.safeParse(object);
    if (!validated.success) {
      return apiError('Failed to produce a valid research summary', 502);
    }

    const payload: ResearchSummaryPayload = validated.data;

    return apiSuccess({ summary: payload });
  } catch (err) {
    devWarn('[research-summary] generateObject failed', err);
    return apiError('Research summarisation failed. Please try again.', 502);
  }
}