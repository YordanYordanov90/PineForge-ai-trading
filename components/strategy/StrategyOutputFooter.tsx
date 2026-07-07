'use client';

import { BarChart3, Radio, ShieldCheck } from 'lucide-react';

export function StrategyOutputFooter() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="pf-output-footer-tile flex items-start gap-2.5 rounded-xl p-3">
        <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-600 dark:text-neon-500/70" />
        <div>
          <div className="pf-output-footer-title text-zinc-900 dark:text-zinc-200">Alert tiers</div>
          <div className="pf-output-footer-caption mt-0.5 text-xs text-zinc-700 dark:text-zinc-500">
            Getting Ready &middot; Average &middot; Strong
          </div>
        </div>
      </div>
      <div className="pf-output-footer-tile flex items-start gap-2.5 rounded-xl p-3">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-500/70" />
        <div>
          <div className="pf-output-footer-title text-zinc-900 dark:text-zinc-200">Auto lines</div>
          <div className="pf-output-footer-caption mt-0.5 text-xs text-zinc-700 dark:text-zinc-500">
            SL / TP drawn with labels
          </div>
        </div>
      </div>
      <div className="pf-output-footer-tile flex items-start gap-2.5 rounded-xl p-3">
        <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-500/70" />
        <div>
          <div className="pf-output-footer-title text-zinc-900 dark:text-zinc-200">Risk rules</div>
          <div className="pf-output-footer-caption mt-0.5 text-xs text-zinc-700 dark:text-zinc-500">
            Sized from account balance
          </div>
        </div>
      </div>
    </div>
  );
}