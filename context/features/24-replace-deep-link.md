# 24 — TradingView Copy & Open (Replace Deep Link)

Replace the broken deep link approach with a reliable "Copy & Open" pattern.
The previous `getTradingViewDeepLink` URL format (`pine-editor/?script=`) is
an undocumented endpoint that returns 404. This spec replaces it with a
two-action button: copy script to clipboard + open TradingView Pine Editor
in a new tab simultaneously.

## What Changes

### 1. Update `lib/scripts/tradingview.ts`

Replace the entire file contents with:

```ts
/**
 * TradingView Pine Editor Utilities
 * Deep link URL format is undocumented and unreliable.
 * Reliable approach: copy script to clipboard + open Pine Editor in new tab.
 * User arrives at Pine Editor with script ready to paste (Ctrl+V).
 */

export async function copyAndOpenTradingView(script: string): Promise<void> {
  if (!script?.trim()) return

  try {
    await navigator.clipboard.writeText(script)
  } catch {
    // clipboard failed silently — user can still paste manually
  }

  window.open(
    'https://www.tradingview.com/pine-editor/',
    '_blank',
    'noopener,noreferrer'
  )
}
```

Remove `getTradingViewDeepLink` and `openInTradingView` entirely —
they are replaced by `copyAndOpenTradingView`.

### 2. Update `components/strategy/StrategyOutputCard.tsx`

Find the "Open in TradingView" button and update its `onClick` handler:

**Before:**
```tsx
onClick={() => openInTradingView(currentScript)}
```

**After:**
```tsx
onClick={() => copyAndOpenTradingView(currentScript).then(() => {
  toast.success('Script copied — paste it in Pine Editor')
})}
```

Update the import to use `copyAndOpenTradingView` instead of
`openInTradingView`.

Button label, placement, and disabled state remain unchanged:
- Still disabled when no script or `isGenerating`
- Still positioned after Stop, before Download in the output header

### 3. Update `StrategyForm.tsx` keyboard shortcut (Ctrl/Cmd+T)

Find the existing `Ctrl/Cmd+T` handler and update the call:

**Before:**
```ts
if (currentScript && !isGenerating) {
  openInTradingView(currentScript)
}
```

**After:**
```ts
if (currentScript && !isGenerating) {
  copyAndOpenTradingView(currentScript).then(() => {
    toast.success('Script copied — paste it in Pine Editor')
  })
}
```

### 4. Update `GeneratorCommandMenu.tsx` palette action

Find the `open-in-tradingview` palette entry and update the action:

**Before:**
```ts
action: () => openInTradingView(currentScript),
```

**After:**
```ts
action: () => copyAndOpenTradingView(currentScript).then(() => {
  toast.success('Script copied — paste it in Pine Editor')
}),
```

### 5. Update `context/progress-tracker.md`

Find the TradingView deep link entry in **Architecture Decisions** and
replace it with:

```
- **TradingView Copy & Open**: `copyAndOpenTradingView(script)` in
  `lib/scripts/tradingview.ts` copies the script to clipboard and opens
  `https://www.tradingview.com/pine-editor/` in a new tab simultaneously.
  User arrives at Pine Editor with script ready to paste (Ctrl+V).
  Sonner toast confirms "Script copied — paste it in Pine Editor".
  TradingView's deep link URL format (`pine-editor/?script=`) is undocumented
  and returned 404 — this approach is reliable and requires no URL encoding.
  Client-only utility. Button in `StrategyOutputCard`, Ctrl/Cmd+T shortcut
  in `StrategyForm`, and palette action in `GeneratorCommandMenu`.
```

Also update the Completed section entry for specs 21–23 to reflect the fix:

```
- `21-23 TradingView` — Copy & Open pattern: `copyAndOpenTradingView()` copies
  script to clipboard + opens Pine Editor tab; Sonner toast confirmation;
  Ctrl/Cmd+T shortcut with typing guard; command palette entry.
  (Deep link URL format was undocumented and 404'd — replaced in spec 24.) ✅
```

## Scope Limits

- Only touch the four files listed above plus progress-tracker.md
- Do not change button label, placement, or disabled logic
- Do not change the keyboard shortcut guard logic
- Do not change the command palette entry label or shortcut display
- Do not modify any other files

## Check When Done

- `lib/scripts/tradingview.ts` only exports `copyAndOpenTradingView`
- No references to `openInTradingView` or `getTradingViewDeepLink` remain
  anywhere in the codebase
- Button click copies script and opens `tradingview.com/pine-editor/`
- Sonner toast shows "Script copied — paste it in Pine Editor"
- Ctrl/Cmd+T does the same as the button
- Command palette action does the same as the button
- `progress-tracker.md` reflects the corrected implementation
- `npm run build` passes with no type errors