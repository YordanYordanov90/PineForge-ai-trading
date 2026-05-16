import { PINE_WEBHOOK_ALERT_MESSAGES } from '@/lib/config/constants';

const PLACEHOLDER_WEBHOOK_URL = 'https://your-webhook-url.com';

export type WebhookJsonExport = {
  meta: {
    generatedBy: 'PineForge';
    pineVersion: 'v5';
  };
  alertMessages: readonly [
    (typeof PINE_WEBHOOK_ALERT_MESSAGES)[number],
    (typeof PINE_WEBHOOK_ALERT_MESSAGES)[number],
    (typeof PINE_WEBHOOK_ALERT_MESSAGES)[number],
  ];
  tradingView: {
    messageFieldTemplate: '{{ticker}} {{interval}} {{message}}';
  };
  sampleHttpRequest: {
    method: 'POST';
    url: string;
    headers: { 'Content-Type': 'application/json' };
    body: {
      ticker: '{{ticker}}';
      interval: '{{interval}}';
      message: (typeof PINE_WEBHOOK_ALERT_MESSAGES)[number];
    };
  };
};

export function buildWebhookJsonExport(webhookUrlInput: string): WebhookJsonExport {
  const trimmed = webhookUrlInput.trim();
  const url = trimmed.length > 0 ? trimmed : PLACEHOLDER_WEBHOOK_URL;

  return {
    meta: {
      generatedBy: 'PineForge',
      pineVersion: 'v5',
    },
    alertMessages: [...PINE_WEBHOOK_ALERT_MESSAGES] as WebhookJsonExport['alertMessages'],
    tradingView: {
      messageFieldTemplate: '{{ticker}} {{interval}} {{message}}',
    },
    sampleHttpRequest: {
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      body: {
        ticker: '{{ticker}}',
        interval: '{{interval}}',
        message: PINE_WEBHOOK_ALERT_MESSAGES[0],
      },
    },
  };
}
