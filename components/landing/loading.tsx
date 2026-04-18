export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="relative flex items-center justify-center">
        <div className="size-12 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
        <div className="absolute size-8 animate-pulse rounded-full bg-emerald-500/10" />
      </div>
    </div>
  );
}