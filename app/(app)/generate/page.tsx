import { auth } from '@clerk/nextjs/server';
import { TerminalPriceTicker } from '@/components/auth/TerminalPriceTicker';
import { GenerateExperience } from '@/components/generate/GenerateExperience';
import { TerminalAmbientBackground } from '@/components/ui/terminal-ambient-background';
import { getUserPlanByClerkId } from '@/lib/db';
import { getTemplateById } from '@/lib/templates/templates';

type GeneratePageProps = {
  searchParams: Promise<{ templateId?: string; scriptId?: string }>;
};

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const { userId } = await auth();
  const initialPlan = await getUserPlanByClerkId(userId);

  const { templateId: rawTemplateId, scriptId: rawScriptId } = await searchParams;
  const parsedScriptId = rawScriptId ? Number.parseInt(rawScriptId, 10) : NaN;
  const initialScriptId =
    Number.isFinite(parsedScriptId) && parsedScriptId > 0 ? parsedScriptId : null;
  const template = rawTemplateId ? getTemplateById(rawTemplateId) : undefined;
  const templateLocked =
    Boolean(template?.isPro) && initialPlan !== 'pro';
  const initialTemplateId =
    template && !templateLocked ? template.id : null;

  return (
    <div className="pf-page relative min-h-screen">
      <TerminalAmbientBackground variant="generate" className="-z-10" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 py-10 pb-28 sm:py-14 sm:pb-32">
        <GenerateExperience
          initialPlan={initialPlan}
          initialTemplateId={initialTemplateId}
          initialScriptId={initialScriptId}
          templateLockedNotice={templateLocked}
        />
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        <TerminalPriceTicker variant="generate" />
      </div>
    </div>
  );
}