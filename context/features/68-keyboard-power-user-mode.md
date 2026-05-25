# 68 — Keyboard Power User Mode

## Goal

Extend the existing Ctrl+K / Ctrl+Enter / Ctrl+T shortcut system into a
fully keyboard-navigable generator experience — reinforcing PineForge's
terminal identity and rewarding power users.

---

## Problem

The existing shortcuts cover generation and the command palette, but most of
the generator workflow still requires mouse interaction. Power users — active
traders who open PineForge multiple times a day — lose time reaching for the
mouse to switch tabs, navigate history, or trigger output tools.

---

## New Shortcuts

All shortcuts respect the existing typing guard: disabled when focus is inside
a text input or textarea to prevent accidental triggers.

### Output Tab Shortcuts

| Shortcut | Action |
|----------|--------|
| `1` | Switch output to Script tab |
| `2` | Switch output to Breakdown tab |
| `3` | Switch output to Checklist tab |
| `4` | Switch output to Health tab |
| `5` | Switch output to Alerts tab |
| `6` | Switch output to Backtest tab |
| `7` | Switch output to Compare tab (when available) |

### History Drawer Shortcuts (when drawer is open)

| Shortcut | Action |
|----------|--------|
| `j` | Move selection down one entry |
| `k` | Move selection up one entry |
| `Enter` | Load the selected entry |
| `d` | Delete the selected entry (with confirmation) |
| `s` | Toggle star on selected entry |
| `Escape` | Close the drawer |

### Generator Shortcuts (new additions)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+H` | Open script history drawer |
| `Ctrl/Cmd+D` | Download current script (mirrors existing Download button) |
| `Ctrl/Cmd+Shift+H` | Run Health Score on current script |
| `Ctrl/Cmd+Shift+B` | Run Backtest Summary on current script |
| `Ctrl/Cmd+Shift+A` | Run Alert Templates on current script |

---

## Context-Aware Status Bar

A slim status bar (24px tall) anchored above the existing bottom ticker on
`/generate` shows the available shortcuts for the current context:

- Default: `[1–7] Tabs  [⌘K] Palette  [⌘↵] Generate  [⌘H] History`
- When history is open: `[j/k] Navigate  [↵] Load  [d] Delete  [s] Star  [Esc] Close`
- When generating: `[⌘.] Stop` (Ctrl/Cmd+. already cancels; this makes it visible)

The status bar uses `text-zinc-500` mono text with emerald highlights on the
key labels. It respects `prefers-reduced-motion` and does not animate.

---

## Implementation

### Shortcut registration

All new shortcuts are registered in `hooks/useKeyboardShortcuts.ts` (or a
dedicated `hooks/useGeneratorShortcuts.ts` to keep the file focused).

Pattern: same guard as existing shortcuts — `isTyping()` check before any
handler fires.

### History drawer keyboard navigation

New state in `ScriptHistory`:
- `keyboardSelectedIndex: number | null` — tracks highlighted entry
- Reset to `null` when drawer closes
- `j` / `k` cycle through the visible (filtered) entries array
- Selected entry gets a visible ring highlight (emerald, `ring-2`)
- `Enter` calls the existing `onLoad` handler

### Tab switching

`useStrategyOutputResets` already owns the `activeTab` state. The number keys
dispatch a tab switch via the existing `setActiveTab` handler — no new state
needed.

---

## Command Palette Integration

All new shortcuts are also listed as discoverable entries in the existing
`GeneratorCommandMenu` (Ctrl+K palette):

- "Switch to Health tab — 4"
- "Open History — ⌘H"
- "Run Health Score — ⌘⇧H"
- etc.

This surfaces the shortcuts to users who discover the command palette first.

---

## Tooltip Updates

All output tab buttons gain updated `ActionTooltip` content showing their
number shortcut:

- `Script (1)`, `Breakdown (2)`, `Health (4)`, etc.

---

## Accessibility

- All shortcuts documented in an accessible `<kbd>` table on a `/shortcuts`
  page (or a "Keyboard Shortcuts" section inside the command palette)
- Screen reader announcement when tab changes via keyboard: `aria-live="polite"`
  region already present on output tabs

---

## Out of Scope (This Spec)

- Vim-mode for the strategy textarea (too opinionated)
- Customisable keybindings
- Mobile/touch equivalents
- Forge page keyboard shortcuts (separate spec if needed)

---

## Affected Files

New:
- `hooks/useGeneratorShortcuts.ts` — new shortcuts registration
- `components/generate/GeneratorStatusBar.tsx` — context-aware hint bar
- `app/shortcuts/page.tsx` — keyboard shortcuts reference page (optional)

Modified:
- `hooks/useKeyboardShortcuts.ts` — extend or delegate to `useGeneratorShortcuts`
- `components/strategy/ScriptHistory.tsx` — keyboard navigation state
- `components/strategy/StrategyOutputTabs.tsx` — number key tab switching,
  updated tooltips
- `components/generate/GeneratorCommandMenu.tsx` — new shortcut entries
- `components/generate/GenerateExperience.tsx` — render `GeneratorStatusBar`

---

## Success Criteria

- Number keys 1–7 switch output tabs correctly (guard prevents firing in textarea)
- j/k/Enter/d/s/Escape navigate and act in the history drawer
- New Ctrl/Cmd shortcuts trigger their actions without interfering with browser
  defaults (tested on macOS and Windows)
- Status bar shows correct hints for the current context
- All new shortcuts are discoverable via the command palette
- `npm run build` passes
