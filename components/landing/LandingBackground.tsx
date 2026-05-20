export function LandingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="terminal-grid-bg absolute inset-0 opacity-[0.14] mask-[linear-gradient(to_bottom,white_0%,white_40%,transparent_85%)] dark:opacity-[0.08]"
        aria-hidden
      />
      <div className="absolute top-0 left-0 h-[35%] w-[40%] rounded-full bg-emerald-400/15 blur-[100px] dark:bg-emerald-500/10 dark:mix-blend-screen sm:blur-[120px] lg:blur-[160px]" />
      <div className="absolute -right-[10%] bottom-0 h-[45%] w-[45%] rounded-full bg-emerald-600/10 blur-[100px] dark:bg-emerald-800/10 dark:mix-blend-screen sm:blur-[120px]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTYsMTg1LDEyOSwwLjA2KSIvPjwvc3ZnPg==')] opacity-40 mask-[linear-gradient(to_bottom,white,transparent)] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] dark:opacity-50" />
    </div>
  );
}
