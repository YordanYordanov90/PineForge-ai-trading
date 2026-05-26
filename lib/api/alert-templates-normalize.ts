import { coerceMessageJsonString } from '@/lib/api/json-coerce';
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
  const compact = raw.trim().toLowerCase().replace(/[\s_\-./]+/g, '');
  if (!compact) return null;
  if (compact === '3commas' || compact === '3c') return '3commas';
  if (compact === 'alertatron') return 'alertatron';
  if (compact === 'wundertrading' || compact === 'wunder') return 'wundertrading';
  if (compact === 'custom' || compact === 'customwebhook' || compact === 'webhook') {
    return 'custom';
  }
  if (compact.includes('3commas') || compact.startsWith('3c')) return '3commas';
  if (compact.includes('alertatron')) return 'alertatron';
  if (compact.includes('wunder')) return 'wundertrading';
  if (compact.includes('webhook') || compact.includes('custom')) return 'custom';
  return null;
}

function normalizeMessageJson(raw: unknown): string | null {
  return coerceMessageJsonString(raw);
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

type NormalizeRejectReason =
  | 'unmappable-provider'
  | 'duplicate-provider'
  | 'invalid-message-json'
  | 'strict-schema-failed';

const FALLBACK_PAYLOADS: Record<AlertTemplateProvider, Record<string, unknown>> = {
  '3commas': {
    message_type: 'bot',
    bot_id: 'YOUR_BOT_ID',
    email_token: 'YOUR_EMAIL_TOKEN',
    delay_seconds: 0,
    pair: '{{ticker}}',
    action: 'enter_long',
  },
  alertatron: {
    exchanges: [
      {
        exchange: 'YOUR_EXCHANGE',
        pair: '{{ticker}}',
        action: 'buy',
      },
    ],
  },
  wundertrading: {
    action: 'open',
    symbol: '{{ticker}}',
    side: 'buy',
    type: 'market',
    apiKey: 'YOUR_API_KEY',
  },
  custom: {
    event: 'signal',
    symbol: '{{ticker}}',
    action: 'buy',
    secret: 'YOUR_WEBHOOK_SECRET',
  },
};

const FALLBACK_META: Record<
  AlertTemplateProvider,
  { label: string; description: string; placeholders: string[] }
> = {
  '3commas': {
    label: '3Commas Signal Bot',
    description: 'SmartTrade / signal bot webhook message for TradingView alerts.',
    placeholders: ['YOUR_BOT_ID', 'YOUR_EMAIL_TOKEN'],
  },
  alertatron: {
    label: 'Alertatron',
    description: 'Command-style JSON for Alertatron TradingView webhooks.',
    placeholders: ['YOUR_EXCHANGE'],
  },
  wundertrading: {
    label: 'WunderTrading',
    description: 'Webhook signal format for WunderTrading automation.',
    placeholders: ['YOUR_API_KEY'],
  },
  custom: {
    label: 'Custom Webhook',
    description: 'Generic JSON payload for any HTTP webhook receiver.',
    placeholders: ['YOUR_WEBHOOK_SECRET'],
  },
};

function buildFallbackTemplate(provider: AlertTemplateProvider): AlertTemplateItem {
  const meta = FALLBACK_META[provider];
  return alertTemplateItemSchema.parse({
    provider,
    label: meta.label,
    description: meta.description,
    messageJson: JSON.stringify(FALLBACK_PAYLOADS[provider], null, 2),
    notes: [
      'Starter template — replace placeholders before going live.',
      'Paste into the TradingView alert message field for this provider.',
    ],
    placeholders: meta.placeholders,
  });
}

/**
 * Coerce and repair LLM structured output before strict Zod validation.
 * Missing or invalid provider slots receive safe starter templates (never 502).
 */
export function normalizeAlertTemplatesOutput(raw: unknown): AlertTemplatesResult | null {
  const parsed = alertTemplatesLlmResultSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[alert-templates] loose schema rejected', {
        issues: parsed.error.issues,
      });
    }
    return null;
  }

  const byProvider = new Map<AlertTemplateProvider, AlertTemplateItem>();
  const deferred: Array<{
    template: (typeof parsed.data.templates)[number];
    reason: NormalizeRejectReason;
  }> = [];

  const buildCandidate = (
    template: (typeof parsed.data.templates)[number],
    provider: AlertTemplateProvider,
    messageJson: string,
  ) => ({
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
  });

  for (const template of parsed.data.templates) {
    const messageJson = normalizeMessageJson(template.messageJson);
    if (!messageJson) {
      if (process.env.NODE_ENV === 'development') {
        const preview =
          typeof template.messageJson === 'string'
            ? template.messageJson.slice(0, 120)
            : typeof template.messageJson;
        console.warn('[alert-templates] invalid messageJson', {
          provider: template.provider,
          preview,
        });
      }
      deferred.push({ template, reason: 'invalid-message-json' });
      continue;
    }

    const provider = normalizeProvider(template.provider);
    if (!provider) {
      deferred.push({ template, reason: 'unmappable-provider' });
      continue;
    }
    if (byProvider.has(provider)) {
      deferred.push({ template, reason: 'duplicate-provider' });
      continue;
    }

    const validated = alertTemplateItemSchema.safeParse(
      buildCandidate(template, provider, messageJson),
    );
    if (validated.success) {
      byProvider.set(provider, validated.data);
    } else {
      deferred.push({ template, reason: 'strict-schema-failed' });
    }
  }

  if (byProvider.size < ALERT_TEMPLATE_PROVIDERS.length && deferred.length > 0) {
    const missing = ALERT_TEMPLATE_PROVIDERS.filter((p) => !byProvider.has(p));
    const usableDeferred = deferred.filter((d) => d.reason !== 'invalid-message-json');

    for (const provider of missing) {
      const next = usableDeferred.shift();
      if (!next) break;

      const messageJson = normalizeMessageJson(next.template.messageJson);
      if (!messageJson) continue;

      const validated = alertTemplateItemSchema.safeParse(
        buildCandidate(next.template, provider, messageJson),
      );
      if (validated.success) {
        byProvider.set(provider, validated.data);
      }
    }
  }

  const usedFallbacks: AlertTemplateProvider[] = [];
  for (const provider of ALERT_TEMPLATE_PROVIDERS) {
    if (byProvider.has(provider)) continue;
    usedFallbacks.push(provider);
    byProvider.set(provider, buildFallbackTemplate(provider));
  }

  if (usedFallbacks.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('[alert-templates] filled missing providers with starter templates', {
      usedFallbacks,
      assembled: Array.from(byProvider.keys()),
      rejected: deferred.map((d) => ({
        reason: d.reason,
        provider: d.template.provider,
      })),
    });
  }

  return {
    templates: ALERT_TEMPLATE_PROVIDERS.map((provider) => byProvider.get(provider)!),
  };
}
