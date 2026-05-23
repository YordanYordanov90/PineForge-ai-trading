import 'server-only';

import { generateText, type StepResult, type ToolSet } from 'ai';
import { xai } from '@ai-sdk/xai';
import type {
  AgentMessage,
  AgentToolCall,
  AgentToolResult,
} from '@/lib/types/agent';
import type { GrokModelId } from '@/lib/types';

/**
 * Forge Agent persistence helpers (spec 55).
 *
 * The streaming endpoint owns the round-trip from one user message to
 * a multi-step assistant response (text + tool calls + tool results).
 * After the stream finishes, we persist:
 *
 *   1. one `user` AgentMessage for the request,
 *   2. zero or more `assistant` / `tool` AgentMessages reconstructed
 *      from the AI SDK's `steps[]` array,
 *   3. an auto-generated short title on the first turn (≤60 chars).
 *
 * Conversion rules — one assistant message per step:
 *   - `step.text` → `assistant.content` (empty when the step only
 *     issued tool calls, which is fine — the message still records
 *     the tool calls themselves)
 *   - `step.toolCalls` → `assistant.toolCalls`
 *   - `step.toolResults` (non-empty) → a separate `tool`
 *     AgentMessage immediately after the assistant message, so the
 *     timeline reads "assistant decided to call → tool returned",
 *     matching the order spec 57's UI will render.
 */

const TITLE_MAX_CHARS = 60;
const TITLE_USER_PROMPT_BUDGET = 600;

/**
 * Builds the user message AgentMessage. Centralised here so spec 56's
 * memory extraction, spec 57's rendering, and spec 58's guardrails all
 * see the same shape.
 */
export function buildUserAgentMessage(content: string): AgentMessage {
  return {
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Folds the AI SDK's `steps[]` into the {@link AgentMessage} shape
 * spec 52 stores. Each step contributes one assistant message, and
 * (when it has tool results) one follow-up tool message. The order is
 * preserved so reads round-trip cleanly when the conversation is
 * loaded for a future turn.
 */
export function stepsToAgentMessages<TOOLS extends ToolSet>(
  steps: ReadonlyArray<StepResult<TOOLS>>,
): AgentMessage[] {
  const out: AgentMessage[] = [];
  const now = new Date().toISOString();

  for (const step of steps) {
    const toolCalls: AgentToolCall[] = step.toolCalls.map((call) => ({
      id: call.toolCallId,
      name: call.toolName,
      args:
        call.input != null && typeof call.input === 'object'
          ? (call.input as Record<string, unknown>)
          : {},
    }));

    const text = step.text ?? '';
    if (text.length > 0 || toolCalls.length > 0) {
      out.push({
        role: 'assistant',
        content: text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        createdAt: now,
      });
    }

    if (step.toolResults.length > 0) {
      const toolResults: AgentToolResult[] = step.toolResults.map(
        (result) => ({
          toolCallId: result.toolCallId,
          name: result.toolName,
          result: result.output,
        }),
      );
      out.push({
        role: 'tool',
        content: '',
        toolResults,
        createdAt: now,
      });
    }
  }

  return out;
}

/**
 * Auto-generates a short conversation title (≤60 chars) on the first
 * exchange. Uses a single `generateText` call with a tight prompt and
 * temperature: 0.2 — not a full agent turn — and is invoked from the
 * streaming endpoint's `onFinish` only when the conversation row's
 * `title` column is currently null.
 *
 * Sanitises the LLM output:
 *   - strips surrounding quotes / "Title:" prefixes
 *   - falls back to the first 60 chars of the user message on any
 *     error or empty result, so the conversation is never left with a
 *     null title once it has at least one turn.
 */
export async function generateConversationTitle(
  firstUserMessage: string,
  model: GrokModelId,
  signal: AbortSignal,
): Promise<string> {
  const intent = firstUserMessage.slice(0, TITLE_USER_PROMPT_BUDGET);
  const fallback = firstUserMessage.trim().slice(0, TITLE_MAX_CHARS) || 'New conversation';

  try {
    const { text } = await generateText({
      model: xai(model),
      system:
        'Generate a concise, descriptive title for a Pine Script strategy conversation. Output ONLY the title text — no quotes, no prefixes, no Markdown. Maximum 60 characters. Use sentence case. Avoid emojis.',
      prompt: `First user message:\n${intent}\n\nReturn only the title.`,
      temperature: 0.2,
      maxOutputTokens: 40,
      abortSignal: signal,
    });

    const cleaned = sanitiseTitle(text);
    if (cleaned.length === 0) return fallback;
    return cleaned.slice(0, TITLE_MAX_CHARS);
  } catch {
    return fallback;
  }
}

function sanitiseTitle(raw: string): string {
  return raw
    .trim()
    .replace(/^["'`“”]+|["'`“”]+$/g, '')
    .replace(/^title\s*[:\-—]\s*/i, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}
