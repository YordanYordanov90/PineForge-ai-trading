import { Skeleton } from '@/components/ui/skeleton';

export function ScriptOutputSkeleton() {
  return (
    <div className="relative space-y-3 p-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-[38%] rounded-md bg-zinc-800/60" />
        <Skeleton className="h-4 w-[18%] rounded-md bg-zinc-800/40" />
      </div>
      <Skeleton className="h-4 w-[92%] rounded-md bg-zinc-800/50" />
      <Skeleton className="h-4 w-[84%] rounded-md bg-zinc-800/50" />
      <Skeleton className="h-4 w-[88%] rounded-md bg-zinc-800/50" />
      <Skeleton className="h-4 w-[76%] rounded-md bg-zinc-800/50" />
      <Skeleton className="h-4 w-[90%] rounded-md bg-zinc-800/50" />
      <Skeleton className="h-4 w-[66%] rounded-md bg-zinc-800/45" />
      <div className="pt-2">
        <Skeleton className="h-4 w-[72%] rounded-md bg-zinc-800/40" />
      </div>
    </div>
  );
}
