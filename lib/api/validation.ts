import { z } from 'zod';

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
});