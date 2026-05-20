# 01 — Shortcut Tooltips

Add tooltip-based shortcut hints to the main generator actions. This spec owns
tooltip discoverability only.

## Goal

Surface existing keyboard shortcuts so users discover them without reading docs.

## Scope

Add shadcn `Tooltip` wrappers and shortcut labels for:

- Generate — `Cmd/Ctrl+Enter`
- Command palette trigger — `Cmd/Ctrl+K`
- Open in TradingView — `Cmd/Ctrl+T`
- Copy / Download — label-only tooltips unless new shortcuts are added later

## Files

- `components/strategy/StrategyInputsCard.tsx`
- `components/strategy/StrategyOutputCard.tsx`
- `components/strategy/GeneratorCommandMenu.tsx` if there is a visible trigger button
- `lib/ui/shortcut-label.ts` for platform-aware `Cmd` vs `Ctrl` text if needed

## Rules

- Reuse `components/ui/tooltip.tsx`
- Do not add new keybindings in this step
- Do not change button placement in this step
- Tooltip copy should stay short and operational

## Check When Done

- Tooltips appear on the targeted actions
- Existing shortcuts remain unchanged
- Focus behavior and keyboard navigation still work cleanly
