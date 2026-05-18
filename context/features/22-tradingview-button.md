# 22 — TradingView Open Button

Add the main **"Open in TradingView"** button in the output header.

## Prerequisites

- `21-tradingview-deep-link-utility.md` is complete
- `openInTradingView` function exists in `lib/scripts/tradingview.ts`

## Goal

Deliver the core user value: one-click open in TradingView Pine Editor
directly from the generated script output.

## Implementation

### Add button in Output Header

Location: `components/strategy/OutputHeader.tsx` (or wherever the
Copy / Download `.pine` buttons currently live — check the existing
output card header component before making changes).

```tsx
import { ExternalLink } from 'lucide-react'
import { openInTradingView } from '@/lib/scripts/tradingview'

<button
  onClick={() => openInTradingView(currentScript)}
  disabled={!currentScript || isGenerating}
  className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-50 transition-colors"
>
  <ExternalLink className="h-4 w-4" />
  Open in TradingView
</button>
```

### Placement order in output header (left → right)

```
[Output label] [Validator badge] [Streaming badge] [Stats]
[Stop] [Open in TradingView] [Download .pine] [Copy]
```

### Button states

- **Disabled**: no script present OR `isGenerating` is true
- **Active**: script present AND generation is complete
- Works correctly after both initial generation and refinement

## Scope Limits

- Only the button UI in the output header
- No keyboard shortcut in this step (that is spec 23)
- Do not modify any other component
- Do not touch `components/ui/*`

## Check When Done

- Button appears in output header in correct position
- Button opens TradingView Pine Editor with the script loaded
- Button is disabled during streaming and when no script exists
- Empty script state handled correctly (button disabled, no URL generated)
- Scripts containing non-ASCII characters open correctly in TradingView
- `npm run build` passes with no type errors