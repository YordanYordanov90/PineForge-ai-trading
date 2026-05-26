'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllTemplates,
  filterTemplates,
  type StrategyTemplate,
  type TemplateFilter,
} from '@/lib/templates/templates';
import { TemplateFilterBar } from './TemplateFilterBar';
import { TemplateCard } from './TemplateCard';

type TemplateGridProps = {
  initialPlan?: string;
};

export function TemplateGrid({ initialPlan = 'free' }: TemplateGridProps) {
  const [activeStyle, setActiveStyle] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const router = useRouter();

  const allTemplates = getAllTemplates();
  const userPlan = initialPlan;

  const filtered = useMemo(() => {
    const style = activeStyle === 'All' ? undefined : activeStyle.toLowerCase();
    const diff: TemplateFilter['difficulty'] =
      activeDifficulty === 'All'
        ? undefined
        : (activeDifficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced');
    return filterTemplates({ style, difficulty: diff });
  }, [activeStyle, activeDifficulty]);

  const handleUseAsBase = (id: string) => {
    router.push(`/generate?templateId=${id}`);
  };

  return (
    <div className="space-y-4">
      <TemplateFilterBar
        activeStyle={activeStyle}
        onStyleChange={setActiveStyle}
        activeDifficulty={activeDifficulty}
        onDifficultyChange={setActiveDifficulty}
        resultCount={filtered.length}
        totalCount={allTemplates.length}
      />

      {filtered.length === 0 ? (
        <div className="pf-card p-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          No templates match the current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t: StrategyTemplate) => (
            <TemplateCard
              key={t.id}
              template={t}
              userPlan={userPlan}
              onUseAsBase={handleUseAsBase}
            />
          ))}
        </div>
      )}

      <p className="pt-2 text-center text-xs text-zinc-600 dark:text-zinc-500">
        Free users see the curated public library. Pro unlocks the full set of advanced templates.
      </p>
    </div>
  );
}
