'use client';

import { FORGE_TOOL_LABELS, prettifyForgeToolName } from '@/lib/forge/tool-labels';
import type { UIMessage } from 'ai';

type ToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

function isLoadingToolState(state: ToolPartState): boolean {
  return (
    state === 'input-streaming' ||
    state === 'input-available' ||
    state === 'approval-requested' ||
    state === 'approval-responded'
  );
}

export function getActiveLoadingToolLabel(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== 'assistant') continue;

    for (let j = message.parts.length - 1; j >= 0; j -= 1) {
      const part = message.parts[j];

      if (part.type === 'dynamic-tool') {
        const toolPart = part as { toolName: string; state: ToolPartState };
        if (isLoadingToolState(toolPart.state)) {
          return (
            FORGE_TOOL_LABELS[toolPart.toolName] ??
            prettifyForgeToolName(toolPart.toolName)
          );
        }
      }

      if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
        const toolPart = part as { state: ToolPartState };
        if (isLoadingToolState(toolPart.state)) {
          const toolName = part.type.slice('tool-'.length);
          return (
            FORGE_TOOL_LABELS[toolName] ?? prettifyForgeToolName(toolName)
          );
        }
      }
    }
  }

  return null;
}

type ForgeTypingIndicatorProps = {
  activeToolLabel?: string | null;
};

export function ForgeTypingIndicator({
  activeToolLabel,
}: ForgeTypingIndicatorProps) {
  const label = activeToolLabel
    ? `Running ${activeToolLabel}`
    : 'Forge is thinking';

  return (
    <div
      className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400"
      role="status"
      aria-live="polite"
    >
      <span className="forge-typing-dots flex items-center gap-1" aria-hidden>
        <span className="forge-typing-dot" />
        <span className="forge-typing-dot" />
        <span className="forge-typing-dot" />
      </span>
      <span>
        {label}
        <span className="animate-pulse">_</span>
      </span>
    </div>
  );
}
