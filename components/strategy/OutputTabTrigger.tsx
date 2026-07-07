'use client';

import type { LucideIcon } from 'lucide-react';
import { TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { terminalTabActive } from '@/lib/ui/terminal-texture';
import type { OutputTab } from '@/components/strategy/output-tab-types';

const OUTPUT_TAB_TRIGGER_CLASS =
  'pf-tab-trigger inline-flex shrink-0 items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs font-medium shadow-none disabled:pointer-events-none disabled:opacity-40 sm:px-4';

type OutputTabTriggerProps = {
  value: OutputTab;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
};

export function OutputTabTrigger({ value, icon: Icon, label, disabled }: OutputTabTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      disabled={disabled}
      data-terminal-tab=""
      className={cn(OUTPUT_TAB_TRIGGER_CLASS, terminalTabActive)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
    </TabsTrigger>
  );
}