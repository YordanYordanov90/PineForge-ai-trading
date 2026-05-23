'use client';

import { useEffect, useRef } from 'react';

type UseStrategyKeyboardShortcutsOptions = {
  commandOpen: boolean;
  onCommandOpenChange: (open: boolean | ((prev: boolean) => boolean)) => void;
  onGenerate: () => void | Promise<void>;
  onOpenInTradingView: () => void;
  generatedScript: string;
  isOutputBusy: boolean;
};

export function useStrategyKeyboardShortcuts({
  commandOpen,
  onCommandOpenChange,
  onGenerate,
  onOpenInTradingView,
  generatedScript,
  isOutputBusy,
}: UseStrategyKeyboardShortcutsOptions) {
  const handleGenerateRef = useRef(onGenerate);
  const handleOpenInTradingViewRef = useRef(onOpenInTradingView);
  const commandOpenRef = useRef(commandOpen);
  const generatedScriptRef = useRef(generatedScript);
  const isOutputBusyRef = useRef(isOutputBusy);

  useEffect(() => {
    handleGenerateRef.current = onGenerate;
    handleOpenInTradingViewRef.current = onOpenInTradingView;
    commandOpenRef.current = commandOpen;
    generatedScriptRef.current = generatedScript;
    isOutputBusyRef.current = isOutputBusy;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onCommandOpenChange((open) => !open);
        return;
      }
      if (mod && e.key === 'Enter') {
        if (commandOpenRef.current) return;
        e.preventDefault();
        void handleGenerateRef.current();
        return;
      }
      if (mod && e.key.toLowerCase() === 't') {
        const target = e.target as HTMLElement;
        const isTyping =
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable;
        if (isTyping) return;

        e.preventDefault();
        const script = generatedScriptRef.current;
        if (script.trim() && !isOutputBusyRef.current) {
          handleOpenInTradingViewRef.current();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCommandOpenChange]);
}
