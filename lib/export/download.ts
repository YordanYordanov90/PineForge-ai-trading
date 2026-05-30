/**
 * Generic client-side download helpers (used by Markdown export and Snapshot export).
 * Blob + anchor pattern — no server round-trip.
 */

function sanitizeFilenameBase(title: string): string {
  const collapsed = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return collapsed.slice(0, 80) || 'strategy';
}

/** Safe .md filename. */
export function markdownExportFilename(title: string): string {
  return `${sanitizeFilenameBase(title)}.md`;
}

/** Safe .html filename for snapshots. */
export function snapshotExportFilename(title: string): string {
  return `${sanitizeFilenameBase(title)}-snapshot.html`;
}

/**
 * Trigger a browser download of arbitrary string content as a Blob.
 * No-op on server. Used for both .md and self-contained .html snapshots.
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
