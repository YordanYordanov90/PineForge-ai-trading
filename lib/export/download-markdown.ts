/**
 * Client-only helper for downloading Markdown exports (spec 50).
 * Re-exports the shared download utilities (spec 66 snapshot reuse).
 */
import { downloadBlob, markdownExportFilename } from '@/lib/export/download';

export { markdownExportFilename } from '@/lib/export/download';

/**
 * Trigger a browser download of Markdown content. No-op when `document` is
 * unavailable (SSR).
 */
export function downloadMarkdownFile(title: string, markdown: string): void {
  downloadBlob(markdown, markdownExportFilename(title), 'text/markdown;charset=utf-8');
}
