'use client';

import { useCallback, useState } from 'react';
import { normalizeTags } from '@/lib/scripts/tags';
import type { SavedScript } from '@/lib/types';

type HistoryMutators = {
  renameEntry: (id: string, name: string) => void;
  deleteEntry: (id: string) => void;
  toggleStarEntry: (id: string, isStarred: boolean) => Promise<void>;
  setTagsEntry: (id: string, tags: readonly string[]) => Promise<void>;
  setCollectionEntry: (id: string, collectionId: number | null) => Promise<void>;
};

export function useHistoryEntryEditing({
  renameEntry,
  deleteEntry,
  toggleStarEntry,
  setTagsEntry,
  setCollectionEntry,
}: HistoryMutators) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [starPendingId, setStarPendingId] = useState<string | null>(null);
  const [tagEditingId, setTagEditingId] = useState<string | null>(null);
  const [tagEditValue, setTagEditValue] = useState('');
  const [tagPendingId, setTagPendingId] = useState<string | null>(null);
  const [collectionPendingId, setCollectionPendingId] = useState<string | null>(
    null,
  );

  const startRename = useCallback((entry: SavedScript) => {
    setEditingId(entry.id);
    setEditName(entry.name);
  }, []);

  const commitRename = useCallback(
    (id: string) => {
      renameEntry(id, editName);
      setEditingId(null);
      setEditName('');
    },
    [renameEntry, editName],
  );

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleToggleStar = useCallback(
    (entry: SavedScript) => {
      const nextStarred = !entry.isStarred;
      setStarPendingId(entry.id);
      void toggleStarEntry(entry.id, nextStarred).finally(() => {
        setStarPendingId(null);
      });
    },
    [toggleStarEntry],
  );

  const startEditTags = useCallback((entry: SavedScript) => {
    setTagEditingId(entry.id);
    setTagEditValue(entry.tags.join(', '));
  }, []);

  const commitTags = useCallback(
    (id: string) => {
      const next = normalizeTags(tagEditValue.split(','));
      setTagPendingId(id);
      void setTagsEntry(id, next).finally(() => {
        setTagPendingId(null);
      });
      setTagEditingId(null);
      setTagEditValue('');
    },
    [setTagsEntry, tagEditValue],
  );

  const cancelEditTags = useCallback(() => {
    setTagEditingId(null);
    setTagEditValue('');
  }, []);

  const handleSetCollection = useCallback(
    (id: string, collectionId: number | null) => {
      setCollectionPendingId(id);
      void setCollectionEntry(id, collectionId).finally(() => {
        setCollectionPendingId(null);
      });
    },
    [setCollectionEntry],
  );

  const isStarPending = useCallback(
    (entryId: string) => starPendingId === entryId,
    [starPendingId],
  );

  const isTagPending = useCallback(
    (entryId: string) => tagPendingId === entryId,
    [tagPendingId],
  );

  const isCollectionPending = useCallback(
    (entryId: string) => collectionPendingId === entryId,
    [collectionPendingId],
  );

  return {
    rename: {
      editingId,
      editName,
      onEditNameChange: setEditName,
      startRename,
      commitRename,
      cancelRename,
    },
    tags: {
      tagEditingId,
      tagEditValue,
      onTagEditValueChange: setTagEditValue,
      startEditTags,
      commitTags,
      cancelEditTags,
      isTagPending,
    },
    star: {
      handleToggleStar,
      isStarPending,
    },
    collection: {
      handleSetCollection,
      isCollectionPending,
    },
    deleteEntry,
  };
}
