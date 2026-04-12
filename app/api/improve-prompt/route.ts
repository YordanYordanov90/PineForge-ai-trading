import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { improvePromptSchema } from '@/lib/validation';

const MAX_IMPROVED_PROMPT_LENGTH = 1500;

const IMPROVE_SYSTEM_PROMPT = `You are a Pine Script strategy expert. Your job is to rewrite a user's rough strategy description into a detailed, structured prompt that will produce better Pine Script v5 output.

Rewrite the prompt to include:
1. Specific timeframe and market if provided
2. Clear entry conditions with indicator names and values
3. Clear exit/stop-loss/take-profit rules with R:R if provided
4. Three alert tiers: "Getting Ready", "Average", and "Strong"
5. Risk sizing from account balance
6. Direction (long/short/both) if provided


Return ONLY the improved prompt text. No explanations, no markdown, no preamble.`;

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = improvePromptSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { prompt, market, timeframe, direction, indicators, rr } = parsed.data;

  const contextParts: string[] = [];
  if (market) contextParts.push(`Market: ${market}`);
  if (timeframe) contextParts.push(`Timeframe: ${timeframe}`);
  if (direction) contextParts.push(`Direction: ${direction}`);
  if (indicators?.length)
    contextParts.push(`Indicators: ${indicators.join(', ')}`);
  if (rr) contextParts.push(`Risk-Reward ratio: ${rr}:1`);

  const userPrompt = contextParts.length
    ? `${prompt}\n\nAdditional context: ${contextParts.join('; ')}`
    : prompt;

  try {
    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system: IMPROVE_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 500,
    });

    const improvedPrompt = result.text.slice(0, MAX_IMPROVED_PROMPT_LENGTH);

    return Response.json({ improvedPrompt });
  } catch {
    return Response.json(
      { error: 'Failed to improve prompt. Please try again.' },
      { status: 500 },
    );
  }
}