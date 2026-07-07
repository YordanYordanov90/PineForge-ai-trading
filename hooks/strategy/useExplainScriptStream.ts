'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
export type ExplainScriptMode = 'breakdown' | 'checklist';
export type ExplainScriptPhase = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

type UseExplainScriptStreamOptions = {
  mode: ExplainScriptMode;
  script: string;
  isTabActive: boolean;
  isScriptFinal: boolean;
  cancelKey: number;
  onBreakdownChange?: (text: string | null) => void;
};

function fingerprintScript(script: string): string {
  const trimmed = script.trim();
  const head = trimmed.slice(0, 64);
  const tail = trimmed.slice(-64);
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return `${trimmed.length}:${hash.toString(36)}:${head}:${tail}`;
}

function cacheKeyFor(mode: ExplainScriptMode, script: string) {
  return `${mode}::${fingerprintScript(script)}`;
}

export function useExplainScriptStream({
  mode,
  script,
  isTabActive,
  isScriptFinal,
  cancelKey,
  onBreakdownChange,
}: UseExplainScriptStreamOptions) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<ExplainScriptPhase>('idle');
  const [retryTick, setRetryTick] = useState(0);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const inFlightRef = useRef<AbortController | null>(null);
  const startedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    startedRef.current.clear();
    if (mode === 'breakdown') {
      onBreakdownChange?.(null);
    }
  }, [cancelKey, mode, onBreakdownChange]);

  useEffect(() => {
    if (isTabActive) return;
    inFlightRef.current?.abort();
    inFlightRef.current = null;
    const trimmed = script.trim();
    if (!trimmed) return;
    startedRef.current.delete(cacheKeyFor(mode, script));
  }, [isTabActive, script, mode]);

  useEffect(() => {
    if (mode !== 'breakdown' || !onBreakdownChange) return;
    const trimmed = text.trim();
    onBreakdownChange(trimmed.length > 0 ? trimmed : null);
  }, [mode, text, onBreakdownChange]);

  useEffect(() => {
    const trimmed = script.trim();
    if (!trimmed) {
      inFlightRef.current?.abort();
      inFlightRef.current = null;
      return;
    }

    const key = cacheKeyFor(mode, script);
    const cached = cacheRef.current.get(key);
    if (cached !== undefined) {
      setText(cached);
      setPhase('done');
      return;
    }

    if (!isScriptFinal) {
      setText('');
      setPhase('idle');
      return;
    }

    if (!isTabActive) {
      return;
    }

    if (startedRef.current.has(key)) {
      return;
    }

    startedRef.current.add(key);
    const ac = new AbortController();
    inFlightRef.current = ac;

    let accumulated = '';

    void (async () => {
      try {
        setPhase('loading');
        setText('');
        const res = await fetch('/api/explain-script', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ script, mode }),
          signal: ac.signal,
        });

        if (!res.ok) {
          const maybeJson: unknown = await res.json().catch(() => null);
          const fallback =
            res.status === 409
              ? 'A generation is already in progress.'
              : res.status === 429
                ? 'Too many requests. Please try again in a moment.'
                : 'Request failed. Please try again.';
          toast.error(
            messageFromApiErrorJson(
              maybeJson,
              'Invalid input. Please try again.',
              fallback,
            ),
          );
          startedRef.current.delete(key);
          setPhase('error');
          return;
        }

        if (!res.body) {
          accumulated = await res.text();
          cacheRef.current.set(key, accumulated);
          setText(accumulated);
          setPhase('done');
          return;
        }

        setPhase('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            accumulated += decoder.decode(value, { stream: true });
            setText(accumulated);
          }
        }

        const tail = decoder.decode();
        if (tail) {
          accumulated += tail;
          setText(accumulated);
        }

        cacheRef.current.set(key, accumulated);
        setPhase('done');
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          startedRef.current.delete(key);
          return;
        }
        toast.error('Something went wrong. Please try again.');
        startedRef.current.delete(key);
        setPhase('error');
      }
    })();
  }, [isTabActive, isScriptFinal, script, mode, cancelKey, retryTick]);

  const retry = () => {
    const key = cacheKeyFor(mode, script);
    startedRef.current.delete(key);
    setPhase('idle');
    setText('');
    setRetryTick((t) => t + 1);
  };

  return { text, phase, retry };
}