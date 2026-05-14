import { GenerateExperience } from '@/components/generate/GenerateExperience';

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_15%_10%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_15%,rgba(59,130,246,0.14),transparent_52%),radial-gradient(900px_circle_at_55%_95%,rgba(244,63,94,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.20]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.08]" />
      </div>

      <div className="mx-auto max-w-[1500px] px-6 py-10 sm:py-14">
        <GenerateExperience />
      </div>
    </div>
  );
}