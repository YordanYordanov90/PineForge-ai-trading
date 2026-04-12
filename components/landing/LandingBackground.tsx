export function LandingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute top-0 left-0 h-[30%] w-[30%] rounded-full bg-emerald-500/10 blur-[80px] mix-blend-screen sm:blur-[100px] lg:blur-[150px]" />
      <div className="absolute bottom-0 right-0 h-[40%] w-[40%] rounded-full bg-emerald-800/10 blur-[80px] mix-blend-screen sm:blur-[100px] lg:blur-[150px]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 mask-[linear-gradient(to_bottom,white,transparent)]" />
    </div>
  );
}
