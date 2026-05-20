import {
  ALERT_TEMPLATE_PROVIDERS,
  alertTemplateItemSchema,
  alertTemplatesLlmResultSchema,
  type AlertTemplateItem,
  type AlertTemplateProvider,
  type AlertTemplatesResult,
} from '@/lib/api/validation';

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function normalizeProvider(raw: unknown): AlertTemplateProvider | null {
  if (typeof raw !== 'string') return null;
  const compact = raw.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (compact === '3commas' || compact === '3c') return '3commas';
  if (compact === 'alertatron') return 'alertatron';
  if (compact === 'wundertrading' || compact === 'wunder') return 'wundertrading';
  if (compact === 'custom' || compact === 'customwebhook' || compact === 'webhook') {
    return 'custom';
  }
  return null;
}

function stripMarkdownJsonFence(value: string): string {
  const trimmed = value.trim();
  const match = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

function normalizeMessageJson(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return null;
    }
  }

  if (typeof raw !== 'string') return null;

  const candidates = [raw.trim(), stripMarkdownJsonFence(raw)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed: unknown = JSON.parse(candidate);
      return JSON.stringify(parsed, null, 2);
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeStringList(
  raw: unknown,
  { min, max, itemMax }: { min: number; max: number; itemMax: number },
  fallback: string,
): string[] {
  const items = Array.isArray(raw)
    ? raw
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => truncate(entry, itemMax))
        .filter(Boolean)
    : [];

  const unique = [...new Set(items)];
  if (unique.length >= min) return unique.slice(0, max);
  return [fallback, ...unique].slice(0, max);
}

/**
 * Coerce and repair LLM structured output before strict Zod validation.
 */
export function normalizeAlertTemplatesOutput(raw: unknown): AlertTemplatesResult | null {
  const parsed = alertTemplatesLlmResultSchema.safeParse(raw);
  if (!parsed.success) return null;

  const byProvider = new Map<AlertTemplateProvider, AlertTemplateItem>();

  for (const template of parsed.data.templates) {
    const provider = normalizeProvider(template.provider);
    if (!provider || byProvider.has(provider)) continue;

    const messageJson = normalizeMessageJson(template.messageJson);
    if (!messageJson) continue;

    const candidate = {
      provider,
      label: truncate(typeof template.label === 'string' ? template.label : provider, 80),
      description: truncate(
        typeof template.description === 'string'
          ? template.description
          : `Webhook template for ${provider}.`,
        200,
      ),
      messageJson,
      notes: normalizeStringList(
        template.notes,
        { min: 1, max: 3, itemMax: 300 },
        'Paste this JSON into your TradingView alert message field after replacing placeholders.',
      ),
      placeholders: normalizeStringList(
        template.placeholders,
        { min: 1, max: 8, itemMax: 80 },
        'YOUR_WEBHOOK_SECRET',
      ),
    };

    const validated = alertTemplateItemSchema.safeParse(candidate);
    if (validated.success) {
      byProvider.set(provider, validated.data);
    }
  }

  if (byProvider.size !== ALERT_TEMPLATE_PROVIDERS.length) return null;

  return {
    templates: ALERT_TEMPLATE_PROVIDERS.map((provider) => byProvider.get(provider)!),
  };
}
