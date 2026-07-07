import 'server-only';

import type { ModelMessage } from 'ai';
import type { AgentMessage } from '@/lib/types/agent';

/**
 * Converts persisted {@link AgentMessage} thread into AI SDK {@link ModelMessage}s.
 * v1 is text-only — tool messages are skipped.
 */
export function agentHistoryToModelMessages(
  history: ReadonlyArray<AgentMessage>,
): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const msg of history) {
    if (msg.role === 'user') {
      if (msg.content.length > 0) {
        out.push({ role: 'user', content: msg.content });
      }
      continue;
    }
    if (msg.role === 'assistant') {
      if (msg.content.length > 0) {
        out.push({ role: 'assistant', content: msg.content });
      }
    }
  }
  return out;
}