'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DEFAULT_RR_RATIO } from '@/lib/config/constants';

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
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        Advanced Options
      </button>

      {isOpen && (
        <div className="space-y-4 rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-4 animate-fade-in">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Timeframe</label>
            <select
              value={value.timeframe ?? ''}
              onChange={(e) =>
                onChange({ ...value, timeframe: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-zinc-700/70 bg-zinc-950/60 px-3 py-2 text-sm text-white focus-visible:ring-emerald-400/30"
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
            <label className="text-xs text-zinc-400">Market</label>
            <select
              value={value.market ?? ''}
              onChange={(e) =>
                onChange({ ...value, market: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-zinc-700/70 bg-zinc-950/60 px-3 py-2 text-sm text-white focus-visible:ring-emerald-400/30"
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
            <label className="text-xs text-zinc-400">Direction</label>
            <select
              value={value.direction ?? ''}
              onChange={(e) =>
                onChange({ ...value, direction: e.target.value || undefined })
              }
              className="w-full rounded-lg border border-zinc-700/70 bg-zinc-950/60 px-3 py-2 text-sm text-white focus-visible:ring-emerald-400/30"
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
            <label className="text-xs text-zinc-400">Indicators</label>
            <div className="flex flex-wrap gap-2">
              {INDICATORS.map((ind) => {
                const isActive = value.indicators?.includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndicator(ind)}
                    className={
                      isActive
                        ? 'rounded-full border border-emerald-500/70 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300 transition-colors'
                        : 'rounded-full border border-zinc-700/70 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300'
                    }
                  >
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Risk-Reward Ratio</label>
              <span className="text-xs text-zinc-300 tabular-nums">
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
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}