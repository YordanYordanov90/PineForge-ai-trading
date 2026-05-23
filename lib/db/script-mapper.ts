import type { scripts, ScriptMetadata } from '@/drizzle/schema';
import type { GrokModelId, SavedScript } from '@/lib/types';

type ScriptRow = typeof scripts.$inferSelect;

const GROK_MODEL_IDS = new Set<string>([
  'grok-4-1-fast-reasoning',
  'grok-4-1-fast-non-reasoning',
  'grok-4',
]);

export function parseAccountBalance(balance: string): number | null {
  const normalized = balance.replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const value = Math.round(Number.parseFloat(normalized));
  return Number.isFinite(value) ? value : null;
}

export function formatAccountBalance(value: number | null | undefined): string {
  if (value == null) return '';
  return `$${value.toLocaleString('en-US')}`;
}

function parseModel(model: string | null): GrokModelId | undefined {
  if (model && GROK_MODEL_IDS.has(model)) {
    return model as GrokModelId;
  }
  return undefined;
}

export function rowToSavedScript(row: ScriptRow): SavedScript {
  const meta = (row.metadata ?? {}) as Partial<ScriptMetadata>;
  return {
    id: String(row.id),
    name: row.title?.trim() || 'Untitled strategy',
    prompt: meta.prompt ?? '',
    balance: meta.balance ?? formatAccountBalance(row.accountBalance),
    script: row.content,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    version: row.version ?? 1,
    parentId: row.parentId != null ? String(row.parentId) : undefined,
    model: parseModel(row.model),
    market: meta.market,
    timeframe: meta.timeframe,
    direction: meta.direction,
    indicators: meta.indicators,
    rr: meta.rr,
    isStarred: row.isStarred ?? false,
    tags: row.tags ?? [],
    collectionId: row.collectionId ?? null,
  };
}

export function savedScriptToMetadata(entry: SavedScript): ScriptMetadata {
  return {
    prompt: entry.prompt,
    balance: entry.balance,
    market: entry.market,
    timeframe: entry.timeframe,
    direction: entry.direction,
    indicators: entry.indicators,
    rr: entry.rr,
  };
}

export function savedScriptToCreatePayload(entry: SavedScript) {
  const parentId = entry.parentId
    ? Number.parseInt(entry.parentId, 10)
    : undefined;

  return {
    title: entry.name.trim() || 'Untitled strategy',
    content: entry.script,
    version: entry.version,
    parentId:
      parentId != null && !Number.isNaN(parentId) && parentId > 0
        ? parentId
        : undefined,
    model: entry.model,
    accountBalance: parseAccountBalance(entry.balance),
    metadata: savedScriptToMetadata(entry),
  };
}
