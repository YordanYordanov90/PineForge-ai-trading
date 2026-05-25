'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

type ForgeAssistantMarkdownProps = {
  text: string;
  isStreaming?: boolean;
};

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="break-words">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-neon-600 underline underline-offset-2 hover:text-neon-500 dark:text-neon-400"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block font-mono text-[11px] leading-relaxed text-neon-300/95">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-sm bg-black/55 px-1 py-0.5 font-mono text-[0.85em] text-neon-300/95">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-sm border border-zinc-800/70 bg-black/55 p-3 last:mb-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-neon-500/40 pl-3 text-zinc-600 italic dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  h1: ({ children }) => (
    <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </h4>
  ),
  hr: () => <hr className="my-3 border-zinc-300/60 dark:border-zinc-700/70" />,
};

export function ForgeAssistantMarkdown({
  text,
  isStreaming,
}: ForgeAssistantMarkdownProps) {
  if (!text.trim()) return null;

  return (
    <div
      className={cn(
        'forge-markdown break-words',
        isStreaming && 'forge-streaming-text',
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
