import type { WeeklyHealthPoint } from '@/lib/db/progress-stats';

type Props = {
  data: WeeklyHealthPoint[];
  hasData: boolean;
};

export function HealthScoreTrendChart({ data, hasData }: Props) {
  if (!hasData || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-black/30 text-sm text-zinc-500">
        No scored strategies in the last 8 weeks yet.
      </div>
    );
  }

  const width = 720;
  const height = 180;
  const pad = { left: 36, right: 12, top: 16, bottom: 28 };

  const values = data.map((d) => d.avg);
  const min = Math.max(1, Math.min(...values) - 0.5);
  const max = Math.min(10, Math.max(...values) + 0.5);
  const range = Math.max(0.1, max - min);

  const xFor = (i: number) => pad.left + (i / Math.max(1, data.length - 1)) * (width - pad.left - pad.right);
  const yFor = (v: number) => pad.top + ((max - v) / range) * (height - pad.top - pad.bottom);

  const points = data.map((d, i) => `${xFor(i)},${yFor(d.avg)}`).join(' ');
  const linePath = `M ${points}`;
  const areaPath = `M ${xFor(0)},${height - pad.bottom} L ${points} L ${xFor(data.length - 1)},${height - pad.bottom} Z`;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/40 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {[2, 4, 6, 8, 10].map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="#27272a"
                strokeWidth="1"
              />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" className="fill-zinc-600 text-[10px] font-mono">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area (neon tint) */}
        <path d={areaPath} fill="#c8ff00" fillOpacity="0.08" />

        {/* Line (neon) */}
        <path
          d={linePath}
          fill="none"
          stroke="#c8ff00"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots + labels */}
        {data.map((d, i) => {
          const x = xFor(i);
          const y = yFor(d.avg);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3.5" fill="#c8ff00" stroke="#111111" strokeWidth="1.5" />
              <text x={x} y={height - 8} textAnchor="middle" className="fill-zinc-500 text-[10px] font-mono">
                {d.week}
              </text>
              <text x={x} y={y - 8} textAnchor="middle" className="fill-neon-300 text-[11px] font-mono">
                {d.avg.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 text-center text-[10px] text-zinc-600">Score (1–10) • higher is structurally stronger</div>
    </div>
  );
}
