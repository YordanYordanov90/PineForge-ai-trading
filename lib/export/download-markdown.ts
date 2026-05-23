/**
 * Client-only helper for downloading Markdown exports (spec 50).
 * Uses a Blob + temporary anchor — no backend route required.
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

/** Build a safe `.md` filename from the export title. */
export function markdownExportFilename(title: string): string {
  return `${sanitizeFilenameBase(title)}.md`;
}

/**
 * Trigger a browser download of Markdown content. No-op when `document` is
 * unavailable (SSR).
 */
export function downloadMarkdownFile(title: string, markdown: string): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = markdownExportFilename(title);
  anchor.click();
  URL.revokeObjectURL(url);
}
