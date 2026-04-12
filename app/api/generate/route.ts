import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import { generateSchema } from '@/lib/validation';
import { DEFAULT_MODEL } from '@/lib/constants';

const schema = generateSchema.extend({
  model: generateSchema.shape.model.default(DEFAULT_MODEL),
});

const SYSTEM_PROMPT = `You are an expert TradingView Pine Script v5 developer.

Return ONLY a complete, clean, ready-to-paste //@version=5 indicator() script.
No explanations, no markdown, no extra text, no code blocks.

Strict requirements:
- Use indicator() title="Grok Strategy", overlay=true
- Three alerts using alert() function:
  1. "Buy Getting Ready"
  2. "Average Buy Trigger"
  3. "Strong Buy Trigger"
- When any alert fires: draw dynamic SL and TP lines using line.new + label.new with clear text labels
- Add these inputs at the top:
  • riskPercent = input.float(1.0, "Risk % per Trade")
  • tpMultiplier = input.float(2.0, "Take Profit R-Multiplier")
- Calculate and show suggested position size in comments using the account balance provided
- Use plotshape() for clear buy signals
- Minimal comments only (screener settings + risk note)
- Keep the entire script compact and production-ready

Always start with //@version=5`;

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

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

  const result = streamText({
    model: xai(model),
    system: SYSTEM_PROMPT,
    prompt: `Strategy description: ${strategy}\nAccount balance: ${balance}${contextBlock}`,
    temperature: 0.1,
    maxOutputTokens: 900,
  });

  return result.toTextStreamResponse();
}