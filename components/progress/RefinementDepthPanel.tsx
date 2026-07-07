import type { MostRefinedScript } from '@/lib/db/progress-stats';
import Link from 'next/link';

type Props = {
  avgDepth: number;
  mostRefined: MostRefinedScript[];
};

export function RefinementDepthPanel({ avgDepth, mostRefined }: Props) {
  const isDeep = avgDepth > 3;

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-3">
        <div className="font-mono text-4xl text-neon-400">{avgDepth.toFixed(1)}</div>
        <div className="text-sm text-zinc-400">average versions per strategy</div>
        {isDeep && (
          <span className="ml-auto rounded-full border border-neon-500/40 bg-neon-500/10 px-2 py-0.5 text-xs text-neon-300">
            Deep refiner
          </span>
        )}
      </div>

      {mostRefined.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Highest iteration count</div>
          {mostRefined.map((s) => (
            <Link
              key={s.id}
              href={`/generate?scriptId=${s.id}`}
              className="flex items-center justify-between rounded border border-zinc-800 bg-black/30 px-3 py-2 text-sm hover:border-zinc-700"
            >
              <span className="truncate text-zinc-200">{s.title}</span>
              <span className="font-mono text-neon-400">v{s.version}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No refinements yet — your first versions are v1.</p>
      )}
    </div>
  );
}
