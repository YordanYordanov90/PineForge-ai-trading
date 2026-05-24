'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { ArrowUp, Loader2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const FORGE_MAX_MESSAGE_LENGTH = 4000;
const SOFT_CHAR_WARNING = 3500;
const TEXTAREA_MAX_HEIGHT_PX = 160;

const FORGE_SLASH_COMMANDS: ReadonlyArray<{
  cmd: string;
  prompt: string;
}> = [
  {
    cmd: '/health',
    prompt:
      'Run a Health Score on my latest strategy and summarize the results.',
  },
  {
    cmd: '/backtest',
    prompt: 'Create a backtest plan for my most recent strategy.',
  },
  {
    cmd: '/alerts',
    prompt: 'Generate alert templates for my latest strategy.',
  },
];

type ForgeInputProps = {
  onSubmit: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  reachedMessageCap?: boolean;
};

export function ForgeInput({
  onSubmit,
  onStop,
  isStreaming,
  disabled = false,
  reachedMessageCap = false,
}: ForgeInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const trimmedLength = value.trim().length;
  const canSubmit =
    !disabled &&
    !isStreaming &&
    !reachedMessageCap &&
    trimmedLength > 0 &&
    value.length <= FORGE_MAX_MESSAGE_LENGTH;

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const injectPrompt = (prompt: string) => {
    setValue(prompt);
    textareaRef.current?.focus();
  };

  if (reachedMessageCap) {
    return (
      <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center font-mono text-sm text-amber-700 dark:text-amber-200">
        This conversation has reached the message limit. Start a new conversation to keep chatting with Forge.
      </div>
    );
  }

  const showWarning = value.length >= SOFT_CHAR_WARNING;
  const showDanger = value.length > FORGE_MAX_MESSAGE_LENGTH;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      className={cn(
        'flex w-full flex-col gap-2 rounded-sm border border-zinc-200/80 bg-white/90 p-3 backdrop-blur',
        'shadow-sm transition-[border-color,box-shadow] duration-200',
        'focus-within:border-emerald-500/50 focus-within:shadow-[inset_0_0_15px_oklch(0.7_0.17_160/0.15)]',
        'dark:border-zinc-800/70 dark:bg-zinc-900/80',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-2 shrink-0 font-mono text-sm text-emerald-600 dark:text-emerald-400"
          aria-hidden
        >
          &gt;_
        </span>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) =>
            setValue(event.target.value.slice(0, FORGE_MAX_MESSAGE_LENGTH))
          }
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          aria-label="Message Forge"
          aria-describedby="forge-input-helper"
          placeholder="Ask Forge anything about your strategies…"
          className={cn(
            'pf-input min-h-[2.75rem] max-h-40 flex-1 resize-none overflow-y-auto border-0 bg-transparent font-mono text-sm text-emerald-800 shadow-none focus-visible:ring-0 dark:text-emerald-300/95',
          )}
        />
      </div>

      <div
        className="flex flex-wrap gap-1.5 px-1"
        aria-label="Quick command hints"
      >
        {FORGE_SLASH_COMMANDS.map((item) => (
          <button
            key={item.cmd}
            type="button"
            disabled={disabled || isStreaming}
            onClick={() => injectPrompt(item.prompt)}
            className={cn(
              'rounded-sm border border-zinc-200/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
              'text-emerald-700 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10',
              'dark:border-zinc-700/70 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {item.cmd}
          </button>
        ))}
      </div>

      <div
        id="forge-input-helper"
        className="flex items-center justify-between gap-3 border-t border-zinc-200/60 px-1 pt-2 dark:border-zinc-800/60"
      >
        <p
          className={cn(
            'font-mono text-xs tabular-nums',
            showDanger
              ? 'text-rose-500 dark:text-rose-400'
              : showWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'pf-muted',
          )}
          aria-live="polite"
        >
          {value.length} / {FORGE_MAX_MESSAGE_LENGTH}
          <span className="ml-2 hidden sm:inline">
            Enter send · Shift+Enter newline
          </span>
        </p>

        {isStreaming && onStop ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStop}
            aria-label="Stop Forge response"
            className="rounded-sm border-zinc-300 font-mono text-xs uppercase tracking-wider dark:border-zinc-700"
          >
            <Square className="size-3" aria-hidden />
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmit}
            aria-label="Send message"
            className="rounded-sm bg-emerald-500 font-mono text-xs uppercase tracking-wider text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isStreaming ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="size-3.5" aria-hidden />
            )}
            Send
          </Button>
        )}
      </div>
    </form>
  );
}
