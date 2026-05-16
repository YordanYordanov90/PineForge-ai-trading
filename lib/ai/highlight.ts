import { createHighlighter, type Highlighter, type ThemeRegistration } from 'shiki';

const EMERALD_DARK_THEME: ThemeRegistration = {
  name: 'emerald-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#6ee7b7f2',
  },
  tokenColors: [
    { scope: 'keyword', settings: { foreground: '#6ee7b7' } },
    { scope: 'keyword.control', settings: { foreground: '#6ee7b7' } },
    { scope: 'keyword.operator', settings: { foreground: '#a1a1aa' } },
    { scope: 'string', settings: { foreground: '#fbbf24' } },
    { scope: 'string.escape', settings: { foreground: '#fcd34d' } },
    { scope: 'comment', settings: { foreground: '#71717a', fontStyle: 'italic' } },
    { scope: 'number', settings: { foreground: '#fbbf24' } },
    { scope: 'function', settings: { foreground: '#a7f3d0' } },
    { scope: 'variable', settings: { foreground: '#6ee7b7f2' } },
    { scope: 'operator', settings: { foreground: '#e4e4e7' } },
    { scope: 'punctuation', settings: { foreground: '#a1a1aa' } },
    { scope: 'type', settings: { foreground: '#a7f3d0' } },
    { scope: 'constant', settings: { foreground: '#fbbf24' } },
    { scope: 'storage', settings: { foreground: '#6ee7b7' } },
    { scope: 'support.function', settings: { foreground: '#a7f3d0' } },
    { scope: 'support.constant', settings: { foreground: '#fbbf24' } },
  ],
};

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [EMERALD_DARK_THEME],
      langs: ['javascript'],
    });
  }
  return highlighterPromise;
}

export async function highlightPineScript(code: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: 'javascript',
    theme: 'emerald-dark',
  });
}