import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { generateSchema } from '@/lib/validation';
import { DEFAULT_MODEL } from '@/lib/constants';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/prompts/pine-generate-system';
import { responseIfMissingXaiApiKey } from '@/lib/xai-env';

const schema = generateSchema.extend({
  model: generateSchema.shape.model.default(DEFAULT_MODEL),
});

export async function POST(req: Request) {
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