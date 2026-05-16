import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { generateSchema } from '@/lib/api/validation';
import { DEFAULT_MODEL } from '@/lib/config/constants';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts/pine-generate-system';
import { requireClerkSession } from '@/lib/auth/require-clerk-session';
import { responseIfMissingXaiApiKey } from '@/lib/ai/xai-env';

const schema = generateSchema.extend({
  model: generateSchema.shape.model.default(DEFAULT_MODEL),
});

export async function POST(req: Request) {
  const session = await requireClerkSession();
  if (!session.ok) return session.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const missingKey = responseIfMissingXaiApiKey();
  if (missingKey) return missingKey;

  const {
    prompt: strategy,
    balance,
    model,
    market,
    timeframe,
    direction,
    indicators,
    rr,
  } = parsed.data;

  const contextParts: string[] = [];
  if (market) contextParts.push(`Market: ${market}`);
  if (timeframe) contextParts.push(`Timeframe: ${timeframe}`);
  if (direction) contextParts.push(`Direction: ${direction}`);
  if (indicators?.length)
    contextParts.push(`Preferred indicators: ${indicators.join(', ')}`);
  if (rr) contextParts.push(`Risk-Reward ratio: ${rr}:1`);

  const contextBlock = contextParts.length
    ? `\n\nAdditional context: ${contextParts.join('; ')}`
    : '';

  try {
    const result = streamText({
      model: xai(model),
      system: PINE_GENERATE_SYSTEM_PROMPT,
      prompt: `Strategy description: ${strategy}\nAccount balance: ${balance}${contextBlock}`,
      temperature: 0.1,
      maxOutputTokens: 900,
    });

    return result.toTextStreamResponse();
  } catch {
    return Response.json(
      { error: 'Failed to generate script. Please try again.' },
      { status: 500 },
    );
  }
}