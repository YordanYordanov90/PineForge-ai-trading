import { z } from 'zod';
import { collectionNameInputSchema } from '@/lib/collections/collections';
import { tagsInputSchema } from '@/lib/scripts/tags';

const grokModelEnum = z.enum([
  'grok-4-1-fast-reasoning',
  'grok-4-1-fast-non-reasoning',
  'grok-4',
]);

const rrSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Risk-reward must be a positive number')
  .max(10, 'Risk-reward value too long')
  .optional();

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number'),
  model: grokModelEnum.optional(),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
  rr: rrSchema,
});

export const refineScriptSchema = z.object({
  script: z
    .string()
    .min(10, 'Script too short')
    .max(20_000, 'Script exceeds maximum length'),
  instruction: z
    .string()
    .min(3, 'Instruction too short')
    .max(1000, 'Instruction exceeds 1000 character limit'),
  model: grokModelEnum.optional(),
});

export const explainScriptSchema = z.object({
  script: z
    .string()
    .min(10, 'Script too short')
    .max(20_000, 'Script exceeds maximum length'),
  mode: z.enum(['breakdown', 'checklist']),
});

export const improvePromptSchema = z.object({
  prompt: z.string().min(5).max(1500),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
  rr: rrSchema,
});

const scriptMetadataSchema = z.object({
  prompt: z.string().max(1500),
  balance: z.string().max(32),
  market: z.string().max(32).optional(),
  timeframe: z.string().max(8).optional(),
  direction: z.string().max(32).optional(),
  indicators: z.array(z.string().max(32)).max(8).optional(),
  rr: z.string().max(10).optional(),
  // Spec 64
  variantAxis: z.enum(['risk-tight', 'signal-quality', 'indicator-swap']).optional(),
});

export const createScriptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20_000),
  version: z.number().int().min(1).max(100).default(1),
  parentId: z.number().int().positive().optional(),
  model: grokModelEnum.optional(),
  accountBalance: z.number().int().nonnegative().optional(),
  metadata: scriptMetadataSchema,
});

export const renameScriptSchema = z.object({
  title: z.string().min(1).max(200),
});

export const starScriptSchema = z.object({
  isStarred: z.boolean(),
});

/**
 * Request body for `PATCH /api/scripts/[scriptId]/tags` (spec 41). Shape
 * is validated with {@link tagsInputSchema} (per-tag length + array
 * length); the route still passes `tags` through `normalizeTags()` before
 * persistence — Zod cannot dedupe / lower-case for us.
 */
export const setScriptTagsSchema = z.object({
  tags: tagsInputSchema,
});

/**
 * Request body for `PATCH /api/scripts/[scriptId]/collection` (spec 46).
 * `null` clears the assignment; a positive integer assigns the script to
 * one of the caller's collections (ownership verified server-side).
 */
export const setScriptCollectionSchema = z.object({
  collectionId: z.number().int().positive().nullable(),
});

/**
 * Request body for `POST /api/forge/conversations` (spec 54). When
 * `scriptId` is supplied, the route loads the script and verifies it
 * belongs to the caller before attaching it as initial context. Omitted
 * or `null` means a fresh conversation with no seed script.
 */
export const createConversationSchema = z.object({
  scriptId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('Optional script ID to attach as initial context'),
  type: z
    .enum(['general', 'research'])
    .optional()
    .describe("Conversation mode: 'research' for the research→generate handoff flow (spec 61)"),
});

/**
 * Request body for `PATCH /api/forge/conversations/[conversationId]`
 * (spec 54). v1 only allows renaming the conversation; message body
 * mutations happen exclusively via the streaming endpoint (spec 55).
 */
export const updateConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  scriptId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('Attach a script to a research conversation, change it, or pass null to detach (spec 61.2)'),
});

/**
 * Request body for `POST /api/forge` (spec 55). Conversations are
 * append-only via this endpoint — `conversationId` is required (the
 * thread is created up-front via `POST /api/forge/conversations`),
 * and `message` is the new user turn. Trim happens before length
 * validation so a whitespace-only message is rejected at 400 rather
 * than padded into the LLM context.
 */
export const forgeMessageSchema = z.object({
  conversationId: z
    .number()
    .int()
    .positive()
    .describe('The conversation thread to continue'),
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message exceeds 4000 character limit')
    .describe('The user message'),
});

export type ForgeMessageRequest = z.infer<typeof forgeMessageSchema>;

/**
 * Request body for `POST /api/collections` (spec 45). Shape is validated
 * with {@link collectionNameInputSchema} (min/max length); the route
 * still passes `name` through `normalizeCollectionName()` before the
 * duplicate check so leading/trailing whitespace doesn't reach the DB
 * and the dup check works on the canonical value.
 */
export const createCollectionSchema = z.object({
  name: collectionNameInputSchema,
});

/**
 * Request body for `PATCH /api/collections/[collectionId]` (spec 45).
 * Same shape as create; kept as a separate export so future fields
 * (e.g. color, description) can diverge without affecting create.
 */
export const renameCollectionSchema = z.object({
  name: collectionNameInputSchema,
});

/**
 * Query-param guard for `GET /api/scripts/search` (spec 42). All fields are
 * optional. The route still:
 * - splits comma-separated `tag` entries and runs them through
 *   `normalizeTags()` from `lib/scripts/tags.ts`
 * - coerces `starred` from `'true' | 'false'` to a boolean
 * - parses `collectionId` to a positive integer
 *
 * Caps `q` at 200 chars, individual `tag` entries at 256 chars (allowing
 * comma-separated bundles), and the repeated `tag` array at 50 entries to
 * cap URL length / DoS surface. Final tag list is still clamped to
 * `MAX_TAGS_PER_SCRIPT` by `normalizeTags()`.
 */
export const searchScriptsQuerySchema = z.object({
  q: z.string().trim().max(200, 'Search query too long').optional(),
  tag: z.array(z.string().max(256, 'Tag query value too long')).max(50).default([]),
  starred: z.enum(['true', 'false']).optional(),
  collectionId: z
    .string()
    .regex(/^\d+$/, 'collectionId must be a positive integer')
    .optional(),
});

const healthScoreBulletSchema = z
  .array(z.string().min(1).max(500))
  .min(2)
  .max(4);

export const healthScoreResultSchema = z.object({
  score: z.number().int().min(1).max(10),
  verdict: z.string().min(1).max(40),
  summary: z.string().min(1).max(1200),
  strengths: healthScoreBulletSchema,
  risks: healthScoreBulletSchema,
  nextSteps: healthScoreBulletSchema,
});

export type HealthScoreResult = z.infer<typeof healthScoreResultSchema>;

export const healthScoreRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  script: z
    .string()
    .trim()
    .min(10, 'Script too short')
    .max(20_000, 'Script exceeds maximum length'),
  model: grokModelEnum,
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number')
    .optional()
    .nullable(),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional().nullable(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional().nullable(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional().nullable(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
  // Spec 60: optional assumptions block for cross-reference in risk analysis.
  assumptions: z
    .object({
      items: z.array(z.string()).optional(),
      raw: z.string().optional(),
    })
    .nullable()
    .optional(),
  // Spec 65: optional scriptId to persist the computed score into scripts.metadata.healthScore
  // (only for scripts owned by the caller; ignored otherwise). Enables progression tracker.
  scriptId: z.number().int().positive().optional(),
});

export const alertTemplateProviderEnum = z.enum([
  '3commas',
  'alertatron',
  'wundertrading',
  'custom',
]);

export const ALERT_TEMPLATE_PROVIDERS = alertTemplateProviderEnum.options;

export const alertTemplateItemSchema = z.object({
  provider: alertTemplateProviderEnum,
  label: z.string().min(1).max(80),
  description: z.string().min(1).max(200),
  messageJson: z.string().min(1).max(8000),
  notes: z.array(z.string().min(1).max(300)).min(1).max(3),
  placeholders: z.array(z.string().min(1).max(80)).min(1).max(8),
});

export const alertTemplatesResultSchema = z.object({
  templates: z.array(alertTemplateItemSchema).length(4),
});

/** Loose schema passed to generateObject — normalized before strict validation. */
export const alertTemplatesLlmResultSchema = z.object({
  templates: z
    .array(
      z.object({
        provider: z.string(),
        label: z.string(),
        description: z.string(),
        messageJson: z.unknown(),
        notes: z.array(z.string()).optional(),
        placeholders: z.array(z.string()).optional(),
      }),
    )
    .min(1)
    .max(8),
});

export type AlertTemplateProvider = z.infer<typeof alertTemplateProviderEnum>;
export type AlertTemplateItem = z.infer<typeof alertTemplateItemSchema>;
export type AlertTemplatesResult = z.infer<typeof alertTemplatesResultSchema>;

/**
 * Request body for `POST /api/forge/research-summary` (spec 61).
 * Only the conversationId is accepted from the client; the route loads
 * the messages server-side (owner-scoped) to prevent prompt injection.
 */
export const researchSummaryRequestSchema = z.object({
  conversationId: z.number().int().positive(),
});

/**
 * Structured output schema for the research summarisation LLM call (spec 61).
 * The summariser produces a payload suitable for pre-filling /generate and
 * for storing as traceability notes on the eventual script.
 */
export const researchSummaryPayloadSchema = z.object({
  description: z
    .string()
    .min(20)
    .max(1200)
    .describe('Concise strategy description ready for the generator textarea'),
  market: z.string().min(1).max(80).nullable(),
  timeframe: z.string().min(1).max(40).nullable(),
  direction: z.enum(['Long', 'Short', 'Both']).nullable(),
  indicators: z.array(z.string().min(1).max(40)).max(12),
  researchNotes: z
    .string()
    .min(30)
    .max(4000)
    .describe('Synthesised research insights for script.metadata traceability'),
});

export type ResearchSummaryRequest = z.infer<typeof researchSummaryRequestSchema>;
export type ResearchSummaryPayload = z.infer<typeof researchSummaryPayloadSchema>;

export const alertTemplatesRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  script: z
    .string()
    .trim()
    .min(10, 'Script too short')
    .max(20_000, 'Script exceeds maximum length'),
  model: grokModelEnum,
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number')
    .optional()
    .nullable(),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional().nullable(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional().nullable(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional().nullable(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
});

export const backtestSummaryRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  script: z
    .string()
    .trim()
    .min(10, 'Script too short')
    .max(20_000, 'Script exceeds maximum length'),
  model: grokModelEnum,
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number')
    .optional()
    .nullable(),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional().nullable(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional().nullable(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional().nullable(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
});

const backtestBulletSchema = (min: number, max: number) =>
  z.array(z.string().trim().min(1).max(400)).min(min).max(max);

export const backtestSummarySectionsSchema = z.object({
  recommendedTimeframes: backtestBulletSchema(2, 6),
  recommendedMarkets: backtestBulletSchema(2, 6),
  equityCurveChecks: backtestBulletSchema(3, 8),
  failureModes: backtestBulletSchema(3, 8),
  testPlan: backtestBulletSchema(3, 8),
});

export const backtestSummaryResultSchema = z.object({
  title: z.string().trim().min(1).max(120),
  markdown: z.string().trim().min(1).max(8000),
  sections: backtestSummarySectionsSchema,
});

/**
 * Loose intake schema for `generateObject`. The LLM returns `title` + `sections`
 * only; the route assembles `markdown` deterministically from sections via
 * `assembleBacktestSummaryMarkdown()`, then re-validates the full payload with
 * `backtestSummaryResultSchema` before returning to the client.
 */
export const backtestSummaryLlmResultSchema = z.object({
  title: z.string().trim().min(1).max(120),
  sections: backtestSummarySectionsSchema,
});

/**
 * Request body for `POST /api/generate-variants` (spec 64).
 * The original `prompt` + `script` + structured inputs from the successful
 * generation are sent so the server can build faithful variant prompts.
 * Server resolves plan via protectAiRoute and decides N (1 free / 3 pro).
 */
export const generateVariantsRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  script: z
    .string()
    .trim()
    .min(10, 'Script too short')
    .max(20_000, 'Script exceeds maximum length'),
  model: grokModelEnum,
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number')
    .optional()
    .nullable(),
  structuredInputs: z.object({
    market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional().nullable(),
    timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional().nullable(),
    direction: z.enum(['Long only', 'Short only', 'Both']).optional().nullable(),
    indicators: z
      .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
      .optional(),
    rr: z.string().optional().nullable(),
  }),
});

export type GenerateVariantsRequest = z.infer<typeof generateVariantsRequestSchema>;

export const variantAxisSchema = z.enum(['risk-tight', 'signal-quality', 'indicator-swap']);

export const variantSchema = z.object({
  axis: variantAxisSchema,
  label: z.string().min(1).max(40),
  script: z.string().min(10),
  prompt: z.string().min(10), // the modified prompt actually sent to the model
});

export const generateVariantsResultSchema = z.object({
  variants: z.array(variantSchema).max(3),
});

export type VariantAxis = z.infer<typeof variantAxisSchema>;
export type VariantResult = z.infer<typeof variantSchema>;
export type GenerateVariantsResult = z.infer<typeof generateVariantsResultSchema>;

export type BacktestSummaryRequest = z.infer<typeof backtestSummaryRequestSchema>;
export type BacktestSummarySections = z.infer<typeof backtestSummarySectionsSchema>;
export type BacktestSummaryResult = z.infer<typeof backtestSummaryResultSchema>;
export type BacktestSummaryLlmResult = z.infer<typeof backtestSummaryLlmResultSchema>;

/**
 * Comparison Reports (spec 63).
 * Request accepts exactly 2 or 3 owned script IDs.
 * LLM receives a *loose* schema (comparisonReportLlmSchema) so it can be
 * slightly verbose; the route then re-validates with the stricter
 * comparisonReportSchema (or the same with tighter max lengths) before DB write.
 */
export const comparisonReportRequestSchema = z.object({
  scriptIds: z
    .array(z.number().int().positive())
    .min(2, 'Select at least 2 scripts')
    .max(3, 'Compare at most 3 scripts'),
});

export const comparisonReportLlmSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(600),
  entryLogicComparison: z.string().trim().min(1).max(1200),
  riskProfileComparison: z.string().trim().min(1).max(1200),
  marketConditionFit: z
    .array(
      z.object({
        scriptId: z.number().int().positive(),
        scriptTitle: z.string().trim().min(1).max(200),
        bestFor: z.string().trim().min(1).max(300),
        avoidIn: z.string().trim().min(1).max(300),
      }),
    )
    .min(2)
    .max(3),
  coverageMap: z.object({
    trendy: z.number().int().positive().nullable(),
    ranging: z.number().int().positive().nullable(),
    breakout: z.number().int().positive().nullable(),
  }),
  overlapAssessment: z.enum(['high', 'medium', 'low']),
  overlapNotes: z.string().trim().min(1).max(800),
  recommendation: z.string().trim().min(1).max(1200),
});

/** Strict schema used for final validation before persistence (same shape today). */
export const comparisonReportSchema = comparisonReportLlmSchema;

export type ComparisonReportRequest = z.infer<typeof comparisonReportRequestSchema>;
export type ComparisonReportLlm = z.infer<typeof comparisonReportLlmSchema>;
export type ComparisonReport = z.infer<typeof comparisonReportSchema>;
