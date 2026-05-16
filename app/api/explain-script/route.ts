import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { explainScriptSchema } from '@/lib/api/validation';
import { jsonApiError, protectAiRoute } from '@/lib/api/protected-ai-route';
import { DEFAULT_MODEL, EXPLAIN_MAX_OUTPUT_TOKENS } from '@/lib/config/constants';
import {
  EXPLAIN_BREAKDOWN_SYSTEM,
  EXPLAIN_CHECKLIST_SYSTEM,
} from '@/lib/ai/prompts/explain-script';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';
import { acquireStreamLock } from '@/lib/rate-limit/concurrency';

export async function POST(req: Request) {
  const guard = await protectAiRoute(req);
  if (!guard.ok) return guard.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = explainScriptSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
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

  const { script, mode } = parsed.data;
  const system =
    mode === 'breakdown' ? EXPLAIN_BREAKDOWN_SYSTEM : EXPLAIN_CHECKLIST_SYSTEM;
  const prompt = `Pine Script v5 source:\n\`\`\`pine\n${script}\n\`\`\``;

  try {
    const result = streamText({
      model: xai(DEFAULT_MODEL),
      system,
      prompt,
      temperature: 0.15,
      maxOutputTokens: EXPLAIN_MAX_OUTPUT_TOKENS,
      abortSignal: guard.ctx.req.signal,
      onFinish: () => {
        void lock.release();
      },
    });

    return result.toTextStreamResponse();
  } catch {
    await lock.release();
    return Response.json(
      { error: 'Failed to explain script. Please try again.' },
      { status: 500 },
    );
  }
}
