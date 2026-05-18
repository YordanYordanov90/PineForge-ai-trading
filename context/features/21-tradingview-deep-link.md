# 21 — TradingView Deep Link Utility

Create a reusable utility to generate TradingView Pine Editor deep links
using a modern, future-proof encoding method.

## Goal

Extract the deep link logic into a clean module that works reliably in
client components and avoids deprecated APIs.

## Implementation

### Create `lib/scripts/tradingview.ts`

```ts
/**
 * TradingView Pine Editor Deep Link Utilities
 * Uses modern TextEncoder for UTF-8 safety (avoids deprecated unescape())
 */

export function getTradingViewDeepLink(script: string): string {
  if (!script?.trim()) return ''

  const encoded = btoa(
    Array.from(new TextEncoder().encode(script))
      .map(b => String.fromCharCode(b))
      .join('')
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `https://www.tradingview.com/pine-editor/?script=${encoded}`
}

export function openInTradingView(script: string): void {
  const url = getTradingViewDeepLink(script)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
```

## Scope Limits

- Only the utility functions
- No UI changes
- No keyboard shortcuts
- Do not modify any existing files

## Check When Done

- `lib/scripts/tradingview.ts` created with modern `TextEncoder` encoding
- No `Buffer`, no `unescape()` — browser-safe only
- Both functions exported cleanly
- `npm run build` passes with no type errors