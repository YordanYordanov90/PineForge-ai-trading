import type { UIMessage } from 'ai';
import type { SavedConversation } from '@/lib/types';

export function extractText(message: UIMessage | undefined): string {
  if (!message) return '';
  let text = '';
  for (const part of message.parts) {
    if (part.type === 'text') {
      text += (part as { text: string }).text;
    }
  }
  return text;
}

export function readConversationPayload(raw: unknown): SavedConversation | null {
  if (!raw || typeof raw !== 'object') return null;
  const envelope = raw as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== 'object') return null;
  const payload = envelope.data as { conversation?: unknown };
  const conversation = payload.conversation;
  if (!conversation || typeof conversation !== 'object') return null;
  return conversation as SavedConversation;
}

export function parseSavedScriptId(id: string | undefined): number | null {
  if (!id) return null;
  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}