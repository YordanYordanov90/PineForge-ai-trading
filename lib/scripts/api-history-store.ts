'use client';

import { toast } from 'sonner';
import { z } from 'zod';
import { savedScriptToCreatePayload } from '@/lib/db/script-mapper';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { parseApiSuccessEnvelope } from '@/lib/api/parse-envelope';
import { savedScriptSchema } from '@/lib/scripts/local-history-store';
import type { SavedScript } from '@/lib/types';

export const scriptOneDataSchema = z.object({ script: savedScriptSchema });
export const scriptsListDataSchema = z.object({
  scripts: z.array(savedScriptSchema),
});

/** Stable empty snapshot — useSyncExternalStore requires referential stability */
const EMPTY_SNAPSHOT: SavedScript[] = [];

let apiEntries: SavedScript[] = EMPTY_SNAPSHOT;
const apiListeners = new Set<() => void>();

export function getApiEntries(): SavedScript[] {
  return apiEntries;
}

export function setApiEntries(
  next: SavedScript[] | ((prev: SavedScript[]) => SavedScript[]),
) {
  apiEntries = typeof next === 'function' ? next(apiEntries) : next;
  for (const listener of apiListeners) {
    listener();
  }
}

export function subscribeApi(callback: () => void) {
  apiListeners.add(callback);
  return () => {
    apiListeners.delete(callback);
  };
}

async function readMutationErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  return messageFromApiErrorJson(data, 'Invalid input.', fallback);
}

export async function fetchApiScripts(): Promise<SavedScript[]> {
  const res = await fetch('/api/scripts', { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load script history');
  }
  const data: unknown = await res.json();
  const parsed = parseApiSuccessEnvelope(data, scriptsListDataSchema);
  if (!parsed) {
    throw new Error('Invalid script history response');
  }
  return parsed.scripts;
}

async function syncUserAccount(): Promise<boolean> {
  const res = await fetch('/api/users/sync', { method: 'POST' });
  return res.ok;
}

export async function postApiScript(entry: SavedScript): Promise<SavedScript> {
  const payload = savedScriptToCreatePayload(entry);

  const request = () =>
    fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  let res = await request();
  if (res.status === 404) {
    const synced = await syncUserAccount();
    if (synced) {
      res = await request();
    }
  }

  if (!res.ok) {
    throw new Error(
      await readMutationErrorMessage(res, 'Failed to save script'),
    );
  }
  const data: unknown = await res.json();
  const parsed = parseApiSuccessEnvelope(data, scriptOneDataSchema);
  if (!parsed) {
    throw new Error('Invalid save script response');
  }
  return parsed.script;
}

type ScriptMutationSubpath = '' | '/star' | '/tags' | '/collection';

/**
 * Shared PATCH helper for `/api/scripts/[id]` and its narrow sub-routes.
 * Toasts the server message (or the fallback) on any failure path and resolves
 * to `null`; callers handle the local state update on success.
 */
export async function patchScriptOnApi(
  id: string,
  subpath: ScriptMutationSubpath,
  body: unknown,
  fallbackMessage: string,
): Promise<SavedScript | null> {
  try {
    const res = await fetch(`/api/scripts/${id}${subpath}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error(await readMutationErrorMessage(res, fallbackMessage));
      return null;
    }
    const data: unknown = await res.json();
    const parsed = parseApiSuccessEnvelope(data, scriptOneDataSchema);
    if (!parsed) {
      toast.error(fallbackMessage);
      return null;
    }
    return parsed.script;
  } catch {
    toast.error(fallbackMessage);
    return null;
  }
}

export async function deleteScriptOnApi(
  id: string,
  fallbackMessage: string,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(await readMutationErrorMessage(res, fallbackMessage));
      return false;
    }
    return true;
  } catch {
    toast.error(fallbackMessage);
    return false;
  }
}

export async function migrateLocalEntriesToApi(
  localEntries: SavedScript[],
): Promise<void> {
  const idMap = new Map<string, string>();
  const sorted = [...localEntries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const roots = sorted.filter((e) => e.version === 1 || !e.parentId);
  const children = sorted.filter((e) => e.parentId && e.version > 1);

  for (const entry of roots) {
    const created = await postApiScript({ ...entry, parentId: undefined });
    idMap.set(entry.id, created.id);
  }

  for (const entry of children) {
    const mappedParent = entry.parentId ? idMap.get(entry.parentId) : undefined;
    await postApiScript({
      ...entry,
      parentId: mappedParent,
    });
  }
}
