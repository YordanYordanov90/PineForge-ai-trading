# 11 — Terminal Identity Phase 2

Second pass on terminal polish (builds on UI/08). Unifies the generator's
terminal identity across background, texture ownership, active states, streaming
feedback, output chrome, and typography.

## Goal

Make PineForge feel like one coherent trading terminal — not decorated panels.

## Scope

1. **Unified ambient background** — shared emerald-only shell on `/generate` and auth
2. **Single scanline owner** — `terminal-code-surface` only; no nested scanlines
3. **Unified active phosphor** — `terminal-active-pill/inset/pressed` tokens
4. **Streaming moment** — scanline pulse + cursor glow + mono status line
5. **Terminal chrome** — decorative output panel frame (dots + path + status)
6. **Typography beats** — uppercase mono tab labels + blinking `$` prompt

## Files

- `components/ui/terminal-ambient-background.tsx` (new)
- `components/strategy/TerminalOutputChrome.tsx` (new)
- `app/globals.css`, `lib/ui/terminal-texture.ts`
- `app/generate/page.tsx`, `app/(auth)/layout.tsx`
- `StrategyOutputCard.tsx`, `ScriptOutput.tsx`
- Active-state components: PromptTemplates, StructuredInputs, ModelSelector,
  OutputActionBar, HealthScorePanel, AlertTemplatesPanel, AlertTemplateCard,
  ScriptHistory, GeneratorCommandMenu (CSS)

## Rules

- Readability first; emerald-only accent on generator surfaces
- CSS-only effects; `prefers-reduced-motion` on new animation
- Clerk card scanlines stay inline (white-tint variant) — documented exception

## Check When Done

- `/generate` and auth share ambient shell pattern; no blue/rose on generate
- Code area has one scanline layer
- Active controls use semantic `terminal-active-*` classes consistently
- Streaming state pulses code surface scanlines subtly
- Output panel shows terminal chrome bar above tabs
- Tab labels are mono uppercase; empty state has blinking `$`
