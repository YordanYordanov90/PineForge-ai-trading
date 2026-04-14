import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { explainScriptSchema } from '@/lib/validation';
import { DEFAULT_MODEL, EXPLAIN_MAX_OUTPUT_TOKENS } from '@/lib/constants';
import {
  EXPLAIN_BREAKDOWN_SYSTEM,
  EXPLAIN_CHECKLIST_SYSTEM,
} from '@/lib/prompts/explain-script';

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = explainScriptSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
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
    });

    return result.toTextStreamResponse();
  } catch {
    return Response.json(
      { error: 'Failed to explain script. Please try again.' },
      { status: 500 },
    );
  }
}
