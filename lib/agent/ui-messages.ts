import type { UIMessage } from 'ai';
import type {
  AgentMessage,
  AgentToolCall,
  AgentToolResult,
} from '@/lib/types/agent';

/**
 * Hydrate persisted AgentMessage[] (DB) into AI SDK UIMessage[] for useChat.
 * Folds tool results into assistant parts; emits data-tip parts for tips.
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
    const converted = convertAgentMessage(msg, history, i);
    if (!converted) continue;
    out.push(converted.message);
    if (converted.skipNext) {
      i += 1;
    }
  }

  return out;
}

function convertAgentMessage(
  msg: AgentMessage,
  history: ReadonlyArray<AgentMessage>,
  index: number,
): { message: UIMessage; skipNext: boolean } | null {
  if (msg.role === 'user') {
    return { message: userMessageToUI(msg), skipNext: false };
  }
  if (msg.role === 'assistant') {
    return assistantMessageToUI(msg, history, index);
  }
  if (msg.role === 'tool' && msg.toolResults) {
    const message = toolMessageToUI(msg);
    return message ? { message, skipNext: false } : null;
  }
  return null;
}

function userMessageToUI(msg: AgentMessage): UIMessage {
  return {
    id: nextHydratedId(),
    role: 'user',
    parts: [{ type: 'text', text: msg.content }],
  } as UIMessage;
}

function assistantMessageToUI(
  msg: AgentMessage,
  history: ReadonlyArray<AgentMessage>,
  index: number,
): { message: UIMessage; skipNext: boolean } | null {
  if (msg.tip) {
    return {
      message: {
        id: nextHydratedId(),
        role: 'assistant',
        parts: [
          {
            type: 'data-tip' as const,
            data: msg.tip,
          },
        ] as UIMessage['parts'],
      } as UIMessage,
      skipNext: false,
    };
  }

  const next = history[index + 1];
  const matchedResults =
    next && next.role === 'tool' && next.toolResults ? next.toolResults : [];

  const parts: ForgeUIPart[] = [];
  if (msg.content && msg.content.length > 0) {
    parts.push({ type: 'text', text: msg.content });
  }

  for (const call of msg.toolCalls ?? []) {
    parts.push(toolPartFromCall(call, matchedResults));
  }

  if (parts.length === 0) return null;

  return {
    message: {
      id: nextHydratedId(),
      role: 'assistant',
      parts: parts as UIMessage['parts'],
    } as UIMessage,
    skipNext: matchedResults.length > 0,
  };
}

function toolMessageToUI(msg: AgentMessage): UIMessage | null {
  const parts: ForgeUIPart[] = (msg.toolResults ?? []).map((result) =>
    toolPartFromResult(result),
  );
  if (parts.length === 0) return null;
  return {
    id: nextHydratedId(),
    role: 'assistant',
    parts: parts as UIMessage['parts'],
  } as UIMessage;
}

function toolPartFromCall(
  call: AgentToolCall,
  results: ReadonlyArray<AgentToolResult>,
): ToolPart {
  const result = results.find((r) => r.toolCallId === call.id);
  const type = `tool-${call.name}` as `tool-${string}`;
  if (!result) {
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