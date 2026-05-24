import type { SavedConversation } from '@/lib/types';

export type ConversationTimeGroup = {
  label: string;
  conversations: SavedConversation[];
};

type GroupLabel = 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

export function groupConversationsByTime(
  conversations: SavedConversation[],
): ConversationTimeGroup[] {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const buckets: Record<GroupLabel, SavedConversation[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };

  for (const conversation of sorted) {
    buckets[getConversationGroupLabel(conversation.updatedAt)].push(conversation);
  }

  return (['Today', 'Yesterday', 'This Week', 'Earlier'] as const)
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, conversations: buckets[label] }));
}

function getConversationGroupLabel(updatedAt: string): GroupLabel {
  const parsed = new Date(updatedAt);
  if (!Number.isFinite(parsed.getTime())) return 'Earlier';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const updated = parsed.getTime();

  if (updated >= startOfToday.getTime()) return 'Today';
  if (updated >= startOfYesterday.getTime()) return 'Yesterday';
  if (updated >= startOfWeek.getTime()) return 'This Week';
  return 'Earlier';
}
