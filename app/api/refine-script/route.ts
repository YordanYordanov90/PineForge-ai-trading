import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { refineScriptSchema } from '@/lib/validation';
import { DEFAULT_MODEL, REFINE_MAX_OUTPUT_TOKENS } from '@/lib/constants';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/prompts/pine-generate-system';
import { responseIfMissingXaiApiKey } from '@/lib/xai-env';

const schema = refineScriptSchema.extend({
  model: refineScriptSchema.shape.model.default(DEFAULT_MODEL),
});

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const { script, instruction, model } = parsed.data;

  const refineUserPrompt = `You are refining an existing Pine Script v5 script. Apply the user's instructions and return the complete updated script only (same output rules as a fresh generation).

Current script:
${script}

User instructions:
${instruction}`;

  try {
    const result = streamText({
      model: xai(model),
      system: PINE_GENERATE_SYSTEM_PROMPT,
      prompt: refineUserPrompt,
      temperature: 0.1,
      maxOutputTokens: REFINE_MAX_OUTPUT_TOKENS,
    });

    return result.toTextStreamResponse();
  } catch {
    return Response.json(
      { error: 'Failed to refine script. Please try again.' },
      { status: 500 },
    );
  }
}
