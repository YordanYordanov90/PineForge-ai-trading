'use client';

import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { messageFromApiErrorJson } from '@/lib/api/message-from-api-error';
import { parseApiSuccessEnvelope } from '@/lib/api/parse-envelope';
import { normalizeCollectionName } from '@/lib/collections/collections';
import type { SavedCollection } from '@/lib/types';

const savedCollectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
});

const collectionsListDataSchema = z.object({
  collections: z.array(savedCollectionSchema),
});

const collectionOneDataSchema = z.object({
  collection: savedCollectionSchema,
});

async function parseApiError(res: Response): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  if (res.status === 409) {
    return messageFromApiErrorJson(
      data,
      'A collection with this name already exists.',
      'A collection with this name already exists.',
    );
  }
  return messageFromApiErrorJson(
    data,
    'Invalid request.',
    'Request failed. Please try again.',
  );
}

/**
 * Signed-in collection list + CRUD (spec 47). Fetches from
 * `/api/collections`; signed-out callers get an empty list and
 * `useApi === false`.
 */
export function useCollections() {
  const { isSignedIn, isLoaded } = useUser();
  const useApi = isLoaded && !!isSignedIn;
  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!useApi) {
      setCollections([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/collections', { method: 'GET' });
      if (!res.ok) {
        throw new Error('Failed to load collections');
      }
      const data: unknown = await res.json();
      const collections = parseApiSuccessEnvelope(data, collectionsListDataSchema);
      if (!collections) {
        throw new Error('Invalid collections response');
      }
      setCollections(collections.collections);
    } catch {
      toast.error('Could not load collections');
    } finally {
      setLoading(false);
    }
  }, [useApi]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCollection = useCallback(
    async (rawName: string): Promise<SavedCollection | undefined> => {
      const name = normalizeCollectionName(rawName);
      if (name == null) {
        toast.error('Enter a collection name');
        return undefined;
      }
      if (!useApi) return undefined;

      try {
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return undefined;
        }
        const data: unknown = await res.json();
        const parsed = parseApiSuccessEnvelope(data, collectionOneDataSchema);
        if (!parsed) {
          throw new Error('Invalid create response');
        }
        const created = parsed.collection;
        setCollections((prev) => [created, ...prev]);
        return created;
      } catch {
        toast.error('Could not create collection');
        return undefined;
      }
    },
    [useApi],
  );

  const renameCollection = useCallback(
    async (id: number, rawName: string): Promise<boolean> => {
      const name = normalizeCollectionName(rawName);
      if (name == null) {
        toast.error('Enter a collection name');
        return false;
      }
      if (!useApi) return false;

      try {
        const res = await fetch(`/api/collections/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return false;
        }
        const data: unknown = await res.json();
        const parsed = parseApiSuccessEnvelope(data, collectionOneDataSchema);
        if (!parsed) {
          throw new Error('Invalid rename response');
        }
        const updated = parsed.collection;
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? updated : c)),
        );
        return true;
      } catch {
        toast.error('Could not rename collection');
        return false;
      }
    },
    [useApi],
  );

  const deleteCollection = useCallback(
    async (id: number): Promise<boolean> => {
      if (!useApi) return false;

      try {
        const res = await fetch(`/api/collections/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error(await parseApiError(res));
          return false;
        }
        setCollections((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch {
        toast.error('Could not delete collection');
        return false;
      }
    },
    [useApi],
  );

  return {
    collections,
    loading,
    useApi,
    refresh,
    createCollection,
    renameCollection,
    deleteCollection,
  };
}
