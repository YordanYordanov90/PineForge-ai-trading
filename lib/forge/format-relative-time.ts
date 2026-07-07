export function formatRelativeTime(iso: string): string {
  const parsed = new Date(iso).getTime();
  if (!Number.isFinite(parsed)) return '';
  const diffMs = Date.now() - parsed;
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(parsed).toLocaleDateString();
}