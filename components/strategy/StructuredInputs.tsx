'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DEFAULT_RR_RATIO } from '@/lib/config/constants';
import { terminalActivePill } from '@/lib/ui/terminal-texture';
import { cn } from '@/lib/utils';

export type StructuredInputsValue = {
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
};

type StructuredInputsProps = {
  value: StructuredInputsValue;
  onChange: (value: StructuredInputsValue) => void;
};

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
const MARKETS = ['Stocks', 'Crypto', 'Forex', 'Futures'] as const;
const DIRECTIONS = ['Long only', 'Short only', 'Both'] as const;
const INDICATORS = ['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger'] as const;

const defaultRrString = String(DEFAULT_RR_RATIO);

export function StructuredInputs({ value, onChange }: StructuredInputsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleIndicator = (ind: string) => {
    const current = value.indicators ?? [];
    const next = current.includes(ind)
      ? current.filter((i) => i !== ind)
      : [...current, ind];
    onChange({ ...value, indicators: next });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="pf-label-muted flex items-center gap-1.5 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        Advanced Options
      </button>

      {isOpen && (
        <div className="pf-panel space-y-4 rounded-xl p-4 animate-fade-in">
          <div className="space-y-1.5">
            <label className="pf-label-muted">Timeframe</label>
            <select
              value={value.timeframe ?? ''}
              onChange={(e) =>
                onChange({ ...value, timeframe: e.target.value || undefined })
              }
              className="pf-input w-full rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="pf-label-muted">Market</label>
            <select
              value={value.market ?? ''}
              onChange={(e) =>
                onChange({ ...value, market: e.target.value || undefined })
              }
              className="pf-input w-full rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {MARKETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="pf-label-muted">Direction</label>
            <select
              value={value.direction ?? ''}
              onChange={(e) =>
                onChange({ ...value, direction: e.target.value || undefined })
              }
              className="pf-input w-full rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="pf-label-muted">Indicators</label>
            <div className="flex flex-wrap gap-2">
              {INDICATORS.map((ind) => {
                const isActive = value.indicators?.includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndicator(ind)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      isActive
                        ? terminalActivePill
                        : 'pf-pill',
                    )}
                  >
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="pf-label-muted">Risk-Reward Ratio</label>
              <span className="pf-muted text-xs tabular-nums">
                {value.rr ?? defaultRrString}:1
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={value.rr ?? defaultRrString}
              onChange={(e) => onChange({ ...value, rr: e.target.value })}
              className="w-full accent-neon-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}