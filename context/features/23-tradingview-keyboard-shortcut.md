# 23 — TradingView Keyboard Shortcut

Add **Ctrl/Cmd + T** keyboard shortcut and command palette support
for opening the script in TradingView, with proper typing guard.

## Prerequisites

- `21-tradingview-deep-link-utility.md` is complete
- `22-tradingview-open-button.md` is complete

## Goal

Power-user experience: open script in TradingView without clicking,
while respecting input focus so the shortcut never fires while typing.

## Implementation

### 1. Add global keyboard listener with typing guard

In `StrategyForm.tsx` (or the main generator component that owns the
existing `Ctrl/Cmd+Enter` and `Ctrl/Cmd+K` keyboard listeners —
check the existing `useKeyboardShortcuts` pattern before adding):

```ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isTyping =
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.isContentEditable

    if (isTyping) return // same guard as existing shortcuts

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
      e.preventDefault()
      if (currentScript && !isGenerating) {
        openInTradingView(currentScript)
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [currentScript, isGenerating])
```

### 2. Add to Command Palette

In `GeneratorCommandMenu.tsx`, add alongside existing palette actions:

```ts
{
  id: 'open-in-tradingview',
  label: 'Open in TradingView',
  icon: ExternalLink,
  shortcut: '⌘T',
  action: () => openInTradingView(currentScript),
  disabled: !currentScript || isGenerating,
}
```

### 3. Add tooltip to button (optional)

If shadcn `Tooltip` is already used elsewhere in the output header,
add it to the Open in TradingView button:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button ...>Open in TradingView</button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    Open in TradingView (⌘T)
  </TooltipContent>
</Tooltip>
```

If Tooltip is not already present in the output header, skip this —
do not add it just for this feature.

## Scope Limits

- Only keyboard shortcut and command palette entry
- No new UI buttons (button already exists from spec 22)
- Do not change the button styling or placement
- Do not modify any other existing keyboard shortcuts

## Check When Done

- `Ctrl/Cmd + T` opens TradingView with current script
- Shortcut does NOT fire while typing in textarea or input fields
- Shortcut does NOT fire when no script exists or during generation
- Command palette shows "Open in TradingView" with `⌘T` shortcut label
- Tooltip shows shortcut hint on button hover (if Tooltip already present)
- `npm run build` passes with no type errors