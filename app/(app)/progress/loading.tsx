import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pb-24">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-neon-400/60" />
            <Skeleton className="h-9 w-56 rounded-md" />
          </div>
          <Skeleton className="mt-2 h-4 w-full max-w-2xl rounded-md" />
          <Skeleton className="mt-2 h-4 w-4/5 max-w-xl rounded-md" />
        </div>
      </div>

      <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-800 bg-[#111111] p-6">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="mt-2 h-3 w-64 rounded-md" />
          <Skeleton className="mt-6 h-48 w-full rounded-lg" />
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#111111] p-6">
          <Skeleton className="h-6 w-44 rounded-md" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}