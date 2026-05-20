import {
  DEFAULT_MODEL,
  FREE_TIER_DAILY_GENERATIONS,
  GROK_MODELS,
} from '@/lib/config/constants';
import { RevealOnScroll } from './RevealOnScroll';

const FAQ_ITEMS = [
  {
    id: 'tradingview',
    question: 'Does this actually work with TradingView?',
    answer:
      'Yes. Generated scripts are Pine Script v5 you paste into the Pine Editor. Use Copy & Open in the generator to copy your script and open tradingview.com/pine-editor/ in one step — then paste with Ctrl+V (or Cmd+V).',
  },
  {
    id: 'privacy',
    question: 'Is my strategy private?',
    answer:
      'Your prompts are sent to xAI Grok only to generate output for your session. We do not use your strategies to train models. Signed-in users can save scripts to their account; you control history and can delete entries. API errors are sanitized — raw stack traces never reach the browser.',
  },
  {
    id: 'production-ready',
    question: "What does 'production-ready' mean?",
    answer:
      'Output is structured Pine v5 with comments, risk blocks, and alert tiers where requested. After generation, run the built-in validator badge and optional Strategy Health Score (1–10) for structural feedback before you trade live.',
  },
  {
    id: 'free-plan',
    question: "What's on the free plan?",
    answer: `Free includes ${FREE_TIER_DAILY_GENERATIONS} shared AI actions per 24 hours (generate, refine, improve prompt, explain, health, alerts, and backtest summary). Default model is ${GROK_MODELS.find((m) => m.id === DEFAULT_MODEL)?.label ?? 'Fast'}. All output tabs remain available.`,
  },
  {
    id: 'refine',
    question: 'Can I refine a script?',
    answer:
      'Yes. Refine Chat streams a full replacement script with version tracking. After at least one refine, use the Compare tab to diff against the previous version in your lineage — side by side, line by line.',
  },
  {
    id: 'ai-provider',
    question: 'Where does the AI run?',
    answer:
      'PineForge uses xAI Grok via the Vercel AI SDK on secured API routes. Requests require authentication, rate limits apply per plan, and in-flight generation stops if you cancel or navigate away (abort signal).',
  },
] as const;

export function LandingFAQ() {
  return (
    <section id="faq" className="mb-20 sm:mb-32 lg:mb-40">
      <RevealOnScroll className="mb-10 text-center sm:mb-14">
        <h2 className="pf-heading font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Questions traders ask
        </h2>
      </RevealOnScroll>

      <div className="mx-auto max-w-3xl space-y-3">
        {FAQ_ITEMS.map((item, index) => (
          <RevealOnScroll key={item.id} delay={index * 40}>
            <details className="pf-feature-card group rounded-xl sm:rounded-2xl">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-heading text-base font-semibold text-zinc-900 marker:content-none dark:text-zinc-100 sm:p-6 sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  className="shrink-0 font-mono text-lg text-emerald-600 transition-transform group-open:rotate-45 dark:text-emerald-400"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="pf-muted border-t border-zinc-200/80 px-5 pb-5 pt-0 text-sm leading-relaxed dark:border-zinc-800/60 sm:px-6 sm:pb-6 sm:text-base">
                {item.answer}
              </p>
            </details>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
