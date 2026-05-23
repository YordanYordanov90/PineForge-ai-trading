import type { UIMessage } from 'ai';
import type {
  AgentMessage,
  AgentToolCall,
  AgentToolResult,
} from '@/lib/types/agent';

/**
 * Forge Agent UI message helpers (spec 57).
 *
 * Hydration helpers between the persisted {@link AgentMessage[]} shape
 * (spec 52) and the AI SDK's parts-based {@link UIMessage[]} consumed
 * by `useChat` in the chat view. The streaming endpoint persists the
 * canonical thread via `appendMessages()`; this module is the read
 * path that turns it back into something `useChat` can render.
 *
 * The agent's tool layer keys tool calls as `tool-<name>` (per AI SDK
 * `streamText({ tools })` convention) so when we hydrate from
 * persisted messages we emit the same `tool-<name>` shape. Tool
 * results without a matching call are dropped — they shouldn't occur
 * with the spec-55 persistence rules, but the helper stays defensive.
 */

type TextPart = { type: 'text'; text: string };
type ToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state: 'output-available' | 'output-error';
  input: unknown;
  output?: unknown;
  errorText?: string;
};

type ForgeUIPart = TextPart | ToolPart;

/**
 * Cheap incrementing id source for hydrated messages. The AI SDK
 * generally uses `crypto.randomUUID()`-style ids; for messages that
 * came from the DB any stable string works because they never have to
 * round-trip back through the API as ids.
 */
let hydrationCounter = 0;
function nextHydratedId(): string {
  hydrationCounter += 1;
  return `forge-hydrated-${hydrationCounter}`;
}

/**
 * Converts the persisted {@link AgentMessage[]} thread into AI SDK
 * {@link UIMessage[]} so `useChat({ messages })` can render it on
 * conversation load.
 *
 * The persisted layout is `assistant (text + toolCalls) → tool
 * (toolResults)` — two rows per step. The UI SDK collapses both into
 * the same assistant message's `parts` array, so we look ahead one
 * row whenever we emit an assistant with tool calls and merge the
 * following tool message's results inline by `toolCallId`.
 */
export function agentMessagesToUIMessages(
  history: ReadonlyArray<AgentMessage>,
): UIMessage[] {
  const out: UIMessage[] = [];

  for (let i = 0; i < history.length; i += 1) {
    const msg = history[i];

    if (msg.role === 'user') {
      out.push({
        id: nextHydratedId(),
        role: 'user',
        parts: [{ type: 'text', text: msg.content }],
      } as UIMessage);
      continue;
    }

    if (msg.role === 'assistant') {
      const next = history[i + 1];
      const matchedResults =
        next && next.role === 'tool' && next.toolResults
          ? next.toolResults
          : [];

      const parts: ForgeUIPart[] = [];
      if (msg.content && msg.content.length > 0) {
        parts.push({ type: 'text', text: msg.content });
      }

      for (const call of msg.toolCalls ?? []) {
        parts.push(toolPartFromCall(call, matchedResults));
      }

      if (parts.length === 0) continue;

      out.push({
        id: nextHydratedId(),
        role: 'assistant',
        parts: parts as UIMessage['parts'],
      } as UIMessage);

      if (matchedResults.length > 0) {
        // skip the tool row — its results are folded into the
        // assistant message we just emitted
        i += 1;
      }
      continue;
    }

    // Orphan tool row (no preceding assistant). Render as a
    // standalone assistant message so the user sees *something*
    // rather than dropping the row entirely.
    if (msg.role === 'tool' && msg.toolResults) {
      const parts: ForgeUIPart[] = msg.toolResults.map((result) =>
        toolPartFromResult(result),
      );
      if (parts.length === 0) continue;
      out.push({
        id: nextHydratedId(),
        role: 'assistant',
        parts: parts as UIMessage['parts'],
      } as UIMessage);
    }
  }

  return out;
}

function toolPartFromCall(
  call: AgentToolCall,
  results: ReadonlyArray<AgentToolResult>,
): ToolPart {
  const result = results.find((r) => r.toolCallId === call.id);
  const type = `tool-${call.name}` as `tool-${string}`;
  if (!result) {
    // The persisted shape has a `tool` row whenever the assistant
    // step had any tool calls, but defensively treat a missing
    // result as a generic error rather than leaving the tool part
    // dangling in the UI.
    return {
      type,
      toolCallId: call.id,
      state: 'output-error',
      input: call.args,
      errorText: 'Tool result unavailable.',
    };
  }
  if (result.isError) {
    return {
      type,
      toolCallId: call.id,
      state: 'output-error',
      input: call.args,
      errorText: stringifyError(result.result),
    };
  }
  return {
    type,
    toolCallId: call.id,
    state: 'output-available',
    input: call.args,
    output: result.result,
  };
}

function toolPartFromResult(result: AgentToolResult): ToolPart {
  const type = `tool-${result.name}` as `tool-${string}`;
  if (result.isError) {
    return {
      type,
      toolCallId: result.toolCallId,
      state: 'output-error',
      input: undefined,
      errorText: stringifyError(result.result),
    };
  }
  return {
    type,
    toolCallId: result.toolCallId,
    state: 'output-available',
    input: undefined,
    output: result.result,
  };
}

function stringifyError(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'error' in raw) {
    const err = (raw as { error: unknown }).error;
    if (typeof err === 'string') return err;
  }
  return 'Tool error.';
}
