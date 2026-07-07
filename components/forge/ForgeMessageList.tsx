'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';

const ForgeAssistantMarkdown = dynamic(
  () =>
    import('@/components/forge/ForgeAssistantMarkdown').then((mod) => ({
      default: mod.ForgeAssistantMarkdown,
    })),
  { ssr: false },
);
import { ForgeTipCard } from '@/components/forge/ForgeTipCard';
import { ForgeToolCallCard } from '@/components/forge/ForgeToolCallCard';
import type { ForgeTip } from '@/lib/agent/tips';
import {
  ForgeTypingIndicator,
  getActiveLoadingToolLabel,
} from '@/components/forge/ForgeTypingIndicator';

/**
 * Renders conversation messages for Forge.
 * Handles user/assistant bubbles, tool cards, and special data-tip parts.
 */

type ForgeMessageListProps = {
  messages: UIMessage[];
  isStreaming: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  userAwayFromBottomRef: RefObject<boolean>;
  /** Called when user clicks × on a tip card (local session hide only) */
  onTipDismiss?: (tipId: string) => void;
  /** Called when user clicks the "Refine with this" CTA */
  onTipRefine?: (suggestion?: string) => void;
};

export function ForgeMessageList({
  messages,
  isStreaming,
  bottomRef,
  userAwayFromBottomRef,
  onTipDismiss,
  onTipRefine,
}: ForgeMessageListProps) {
  useEffect(() => {
    if (userAwayFromBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isStreaming, bottomRef, userAwayFromBottomRef]);

  const activeToolLabel = isStreaming
    ? getActiveLoadingToolLabel(messages)
    : null;

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8"
    >
      {messages.map((m) => (
        <ForgeMessage
          key={m.id}
          message={m}
          onTipDismiss={onTipDismiss}
          onTipRefine={onTipRefine}
        />
      ))}

      {isStreaming ? (
        <ForgeTypingIndicator activeToolLabel={activeToolLabel} />
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

function ForgeMessage({
  message,
  onTipDismiss,
  onTipRefine,
}: {
  message: UIMessage;
  onTipDismiss?: (tipId: string) => void;
  onTipRefine?: (suggestion?: string) => void;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            'max-w-[85%] border border-zinc-200/80 bg-zinc-100/90 px-4 py-2.5 text-sm text-zinc-900 shadow-sm',
            'rounded-none rounded-tl-xl rounded-br-xl',
            'dark:border-zinc-700/70 dark:bg-zinc-800/70 dark:text-zinc-100',
          )}
        >
          <UserContent message={message} />
        </div>
      </div>
    );
  }

  if (message.role !== 'assistant') return null;

  return (
    <article
      className={cn(
        'max-w-[92%] space-y-2 border-l-2 border-neon-500/80 bg-gradient-to-r from-neon-500/[0.07] to-transparent py-1 pl-4',
        'dark:from-neon-500/10',
      )}
    >
      <header className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-600/90 dark:text-neon-400/80">
        [SYS] :: {formatMessageTime()}
      </header>
      <div className="space-y-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {message.parts.map((part, idx) =>
          renderAssistantPart(part, idx, onTipDismiss, onTipRefine),
        )}
      </div>
    </article>
  );
}

function UserContent({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { text: string }).text)
    .join('');
  return <p className="whitespace-pre-wrap break-words">{text}</p>;
}

function renderAssistantPart(
  part: UIMessage['parts'][number],
  idx: number,
  onTipDismiss?: (tipId: string) => void,
  onTipRefine?: (suggestion?: string) => void,
) {
  if (part.type === 'text') {
    const { text, state } = part as { text: string; state?: 'streaming' | 'done' };
    return (
      <ForgeAssistantMarkdown
        key={idx}
        text={text}
        isStreaming={state === 'streaming'}
      />
    );
  }

  if (part.type === 'reasoning') {
    const { text } = part as { text: string };
    if (!text) return null;
    return (
      <details
        key={idx}
        className="my-2 rounded-sm border border-zinc-200/70 bg-zinc-100/60 px-3 py-2 text-xs dark:border-zinc-800/70 dark:bg-zinc-900/40"
      >
        <summary className="pf-muted cursor-pointer font-mono uppercase tracking-wide">
          Reasoning
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {text}
        </p>
      </details>
    );
  }

  if (part.type === 'step-start') {
    return null;
  }

  const p = part as { type?: string; data?: { id?: string; title?: string; body?: string; codeSnippet?: string; refineSuggestion?: string; triggerTool?: string } };
  if (p.type === 'data-tip' && p.data?.id) {
    const d = p.data;
    const tip: ForgeTip = {
      id: d.id!,
      title: d.title ?? '',
      body: d.body ?? '',
      codeSnippet: d.codeSnippet,
      refineSuggestion: d.refineSuggestion,
      triggerTool: d.triggerTool ?? '',
    };
    return (
      <ForgeTipCard
        key={`tip-${idx}`}
        tip={tip}
        onDismiss={() => onTipDismiss?.(d.id!)}
        onRefine={onTipRefine}
      />
    );
  }

  if (part.type === 'dynamic-tool') {
    const toolPart = part as DynamicToolPartLike;
    return (
      <ForgeToolCallCard
        key={`${toolPart.toolCallId ?? idx}-${idx}`}
        toolName={toolPart.toolName}
        state={mapToolState(toolPart.state)}
        input={toolPart.input}
        output={toolPart.output}
        errorText={toolPart.errorText}
      />
    );
  }

  if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
    const toolPart = part as ToolPartLike;
    const toolName = part.type.slice('tool-'.length);
    return (
      <ForgeToolCallCard
        key={`${toolPart.toolCallId ?? idx}-${idx}`}
        toolName={toolName}
        state={mapToolState(toolPart.state)}
        input={toolPart.input}
        output={toolPart.output}
        errorText={toolPart.errorText}
      />
    );
  }

  return null;
}

function formatMessageTime(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

type ToolPartLike = {
  toolCallId?: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-available'
    | 'output-error'
    | 'output-denied';
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

type DynamicToolPartLike = ToolPartLike & {
  toolName: string;
};

function mapToolState(
  state: ToolPartLike['state'],
): 'loading' | 'output-available' | 'output-error' | 'output-denied' {
  switch (state) {
    case 'input-streaming':
    case 'input-available':
    case 'approval-requested':
    case 'approval-responded':
      return 'loading';
    case 'output-available':
      return 'output-available';
    case 'output-error':
      return 'output-error';
    case 'output-denied':
      return 'output-denied';
    default:
      return 'loading';
  }
}
