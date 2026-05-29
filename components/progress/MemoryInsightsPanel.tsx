'use client';

type Props = {
  insights: string[];
};

export function MemoryInsightsPanel({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 bg-black/30 px-4 py-6 text-sm text-zinc-500">
        No Forge memory profile yet. Start conversations in <span className="text-neon-400">/forge</span> to build long-term insights.
      </div>
    );
  }

  return (
    <ul className="space-y-2 text-sm text-zinc-200">
      {insights.map((text, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-neon-500" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
