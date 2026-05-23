'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { ForgeToolCallCard } from '@/components/forge/ForgeToolCallCard';

/**
 * Renders the active conversation's messages (spec 57 § Message
 * Rendering).
 *
 * - User messages: right-aligned industrial chamfered bubble.
 * - Assistant messages: left-aligned with terminal prefix and accent rail.
 * - Auto-scrolls to the bottom whenever messages change *or* the chat
 *   transitions out of streaming.
 */

type ForgeMessageListProps = {
  messages: UIMessage[];
  isStreaming: boolean;
};

export function ForgeMessageList({ messages, isStreaming }: ForgeMessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8"
    >
      {messages.map((m) => (
        <ForgeMessage key={m.id} message={m} />
      ))}

      {isStreaming ? (
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          <span
            className="inline-block size-2.5 animate-pulse bg-emerald-500 dark:bg-emerald-400"
            aria-hidden
          />
          <span>
            Forge is thinking
            <span className="animate-pulse">_</span>
          </span>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}

function ForgeMessage({ message }: { message: UIMessage }) {
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
        'max-w-[92%] space-y-2 border-l-2 border-emerald-500/80 bg-gradient-to-r from-emerald-500/[0.07] to-transparent py-1 pl-4',
        'dark:from-emerald-500/10',
      )}
    >
      <header className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600/90 dark:text-emerald-400/80">
        [SYS] :: {formatMessageTime()}
      </header>
      <div className="space-y-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {message.parts.map((part, idx) => renderAssistantPart(part, idx))}
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

function renderAssistantPart(part: UIMessage['parts'][number], idx: number) {
  if (part.type === 'text') {
    const { text, state } = part as { text: string; state?: 'streaming' | 'done' };
    return (
      <p
        key={idx}
        className={cn(
          'whitespace-pre-wrap break-words',
          state === 'streaming' && 'forge-streaming-text',
        )}
      >
        {text}
      </p>
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
