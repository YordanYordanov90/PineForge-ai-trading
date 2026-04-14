# GrokTS — Technical Reference

**Version**: 1.2
**Date**: April 2026
**Companion to**: `PRD_.md`

This file is the single source of truth for all implementation decisions — file structure, types, schemas, constants, API contracts, UI specs, and component-level detail. Hand this file to Cursor / Roo Code alongside `PRD.md` for full context.

---

## 1. Project Structure

```
app/
├── (landing)/
│   └── page.tsx                        ✅ exists — marketing page at /
├── generate/
│   └── page.tsx                        ✅ exists — generator at /generate
├── api/
│   ├── generate/
│   │   └── route.ts                    ✅ exists
│   ├── improve-prompt/
│   │   └── route.ts                    ✅ exists — Phase 1
│   ├── refine-script/
│   │   └── route.ts                    ✅ exists — Refine Chat
│   └── explain-script/
│       └── route.ts                    ✅ exists — Phase 2
└── layout.tsx                          ✅ exists

components/
├── landing/
│   ├── LandingPage.tsx                 ✅ exists — composer
│   ├── LandingNavbar.tsx               ✅ exists — client component (scroll progress bar)
│   ├── LandingHero.tsx                 ✅ exists
│   ├── LandingFeatureGrid.tsx          ✅ exists
│   ├── LandingHowItWorks.tsx           ✅ exists
│   ├── LandingCodePreview.tsx          ✅ exists — terminal mock, not static image
│   ├── LandingCta.tsx                  ✅ exists
│   ├── LandingFooter.tsx               ✅ exists
│   └── LandingBackground.tsx           ✅ exists
├── strategy/
│   ├── StrategyForm.tsx                ✅ exists
│   ├── PromptTemplates.tsx             ✅ exists — task 4
│   ├── ScriptOutput.tsx                ✅ exists — task 5
│   ├── StructuredInputs.tsx            ✅ exists — Phase 1
│   ├── ScriptHistory.tsx               ✅ exists — Phase 2
│   └── RefineChat.tsx                  ✅ exists — Refine Chat
└── ui/
    └── sonner.tsx                      ✅ exists

hooks/
└── useScriptHistory.ts                 ✅ exists — history + buildSavedScriptFromGeneration / Refinement

lib/
├── utils.ts                            ✅ exists
├── constants.ts                        ✅ exists (incl. DEFAULT_RR_RATIO, REFINE_MAX_OUTPUT_TOKENS)
├── prompts/
│   └── pine-generate-system.ts         ✅ shared system prompt (generate + refine-script)
├── validation.ts                       ✅ exists — generateSchema, refineScriptSchema, improvePromptSchema
└── types.ts                            ✅ exists — SavedScript, etc.
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | Vercel AI SDK + @ai-sdk/xai (Grok) |
| Validation | Zod |
| Syntax highlight | shiki (post-stream only — never during streaming) |
| Notifications | sonner |
| Auth (Phase 4) | Clerk |
| Database (Phase 4) | Neon Postgres + Drizzle ORM |
| Rate limiting (Phase 4) | Upstash Redis |

---

## 3. Environment Variables

```env
# .env.example — commit this file
# .env.local  — never commit, already in .gitignore

# ── Required now ──────────────────────────────────────────
XAI_API_KEY=your_xai_key_here

# ── Phase 4 ───────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## 4. Constants — `lib/constants.ts`

```typescript
// lib/constants.ts

export const MAX_PROMPT_LENGTH = 1500;
export const MAX_HISTORY_ENTRIES = 50;
export const CHAR_WARNING_THRESHOLD = 1200;   // amber-400
export const CHAR_DANGER_THRESHOLD = 1400;    // rose-400

export type GrokModelId =
  | 'grok-4-1-fast-reasoning'
  | 'grok-4-1-fast-non-reasoning'
  | 'grok-4';

export type GrokModel = {
  id: GrokModelId;
  label: string;
  description: string;
};

export const GROK_MODELS: GrokModel[] = [
  {
    id: 'grok-4-1-fast-reasoning',
    label: 'Reasoning',
    description: 'Best quality, slower',
  },
  {
    id: 'grok-4-1-fast-non-reasoning',
    label: 'Fast',
    description: 'Quick responses',
  },
  {
    id: 'grok-4',
    label: 'Grok-4',
    description: 'Most capable',
  },
];

export const DEFAULT_MODEL: GrokModelId = 'grok-4-1-fast-reasoning';

export const DEFAULT_RR_RATIO = 2; // default for StructuredInputs R:R slider (stringified in UI)

export const REFINE_MAX_OUTPUT_TOKENS = 2000; // full-script refinements (generate uses 900)
```

---

## 5. TypeScript Types — `lib/types.ts`

```typescript
// lib/types.ts

export type SavedScript = {
  id: string;
  name: string;         // auto-generated from prompt first 40 chars; user-editable
  prompt: string;
  balance: string;
  script: string;
  createdAt: string;    // ISO 8601
  version: number;      // 1 = original; 2+ = refinements
  parentId?: string;    // links refined versions back to the original
  market?: string;
  timeframe?: string;
  direction?: string;
};

export type GenerationStats = {
  durationMs: number;
  estimatedTokens: number;  // approximation: script.length / 4
};
```

---

## 6. Zod Validation — `lib/validation.ts`

```typescript
// lib/validation.ts
// Import and use these schemas in every API route handler
// before passing anything to the LLM.

import { z } from 'zod';

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number'),
  model: z
    .enum([
      'grok-4-1-fast-reasoning',
      'grok-4-1-fast-non-reasoning',
      'grok-4',
    ])
    .optional(),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
  rr: z.string().optional(),
});

export const improvePromptSchema = z.object({
  prompt: z.string().min(5).max(1500),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
  rr: z.string().optional(),
});

export const refineScriptSchema = z.object({
  script: z.string().min(10).max(20000),
  instruction: z.string().min(3).max(1000),
  model: z
    .enum([
      'grok-4-1-fast-reasoning',
      'grok-4-1-fast-non-reasoning',
      'grok-4',
    ])
    .optional(),
});

export const explainScriptSchema = z.object({
  script: z.string().min(10).max(20000),
  mode: z.enum(['breakdown', 'checklist']),
});
```

---

## 7. API Contracts

### `POST /api/generate` ✅ Exists

```typescript
// Request
type GenerateRequest = {
  prompt: string;   // max 1500 chars
  balance: string;  // "12450" or "$12,450.00"
  model?: GrokModelId;  // defaults to DEFAULT_MODEL (server)
  market?: 'Stocks' | 'Crypto' | 'Forex' | 'Futures';
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
  direction?: 'Long only' | 'Short only' | 'Both';
  indicators?: Array<'RSI' | 'MACD' | 'VWAP' | 'EMA' | 'Bollinger'>;
  rr?: string;  // e.g. "2" from range slider — appended as "Risk-Reward ratio: {rr}:1"
};

// Response
// Success: text/event-stream  (Vercel AI SDK streamText)
// Error 400: application/json { error: ZodIssue[] } — client may show generic toast
// Stream/body errors: never raw LLM stack traces
```

### `POST /api/improve-prompt` ✅ Exists (Phase 1)

```typescript
// Request — same structured fields as generate (no balance/model)
type ImprovePromptRequest = {
  prompt: string;
  market?: 'Stocks' | 'Crypto' | 'Forex' | 'Futures';
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
  direction?: 'Long only' | 'Short only' | 'Both';
  indicators?: Array<'RSI' | 'MACD' | 'VWAP' | 'EMA' | 'Bollinger'>;
  rr?: string;
};

// Response 200
type ImprovePromptResponse = {
  improvedPrompt: string;
};

// Error 400: { error: ZodIssue[] }
// Error 500: { error: string } — sanitized message only
```

### `POST /api/refine-script` ✅ Exists (Refine Chat)

```typescript
// Request — stateless MVP (script + instruction + model)
type RefineScriptRequest = {
  script: string;       // min 10, max 20_000 chars
  instruction: string; // min 3, max 1000 chars
  model?: GrokModelId;  // defaults to DEFAULT_MODEL (server)
};

// Response
// Success: text/event-stream (Vercel AI SDK streamText)
// Error 400: application/json { error: ZodIssue[] }
// Error 500: application/json { error: string } — sanitized message only

// Implementation notes
// - system: PINE_GENERATE_SYSTEM_PROMPT from lib/prompts/pine-generate-system.ts (same as /api/generate)
// - maxOutputTokens: REFINE_MAX_OUTPUT_TOKENS (2000)
```

### `POST /api/explain-script` ✅ Exists (Phase 2)

```typescript
// Request
type ExplainScriptRequest = {
  script: string;
  mode: 'breakdown' | 'checklist';
};

// Response: text/event-stream — plain English explanation or numbered checklist
```

---

## 8. API Route Rules (apply to every route)

- Parse and validate with the matching Zod schema **before** any LLM call
- Never return raw LLM errors or stack traces to the client — catch and sanitize
- Never trust client-supplied model IDs — validate against the enum
- Always set appropriate `Content-Type` response headers
- Validation failures (400): `error` field carries Zod issues array — UI should prefer generic copy for users
- Rate limiting: per-IP middleware (Phase 1 optional → Phase 4 required via Upstash)

---

## 9. Script History — localStorage

```typescript
// hooks/useScriptHistory.ts  (Phase 2)

// Storage key
const STORAGE_KEY = 'grokts:history';

// Rules
// - Max entries: MAX_HISTORY_ENTRIES (50) — FIFO eviction when exceeded
// - Always wrap get/set in try/catch — localStorage can throw in private browsing
// - Serialize with JSON.stringify, deserialize with JSON.parse
// - Auto-save triggers when isGenerating transitions false and generatedScript is non-empty
// - Each refinement from RefineChat saves as a new SavedScript with incremented version
//   and parentId pointing to the original script's id

// Example safe read pattern:
// try {
//   const raw = localStorage.getItem(STORAGE_KEY);
//   return raw ? (JSON.parse(raw) as SavedScript[]) : [];
// } catch {
//   return [];
// }
```

---

## 10. shiki Syntax Highlighting Rules

```typescript
// components/strategy/ScriptOutput.tsx

// ⚠️  CRITICAL: shiki is a static highlighter.
//     It CANNOT highlight mid-stream. Attempting to do so will break the output.
//
// Correct pattern:
// useEffect(() => {
//   if (!isGenerating && generatedScript) {
//     // run shiki highlight pass here
//     // swap plain <pre> content for highlighted HTML
//   }
// }, [isGenerating, generatedScript]);
//
// During streaming: render plain <pre><code> with emerald-300/95 text
// After streaming:  swap to shiki-highlighted output — no layout shift, no flash
//
// Theme: override shiki tokens to match emerald-300 on black/55
// Grammar: 'pine' or 'javascript' as fallback
```

---

## 11. Design Tokens

### Colors

| Token | Tailwind class | Usage |
|---|---|---|
| Background | `bg-zinc-950` | Page base |
| Card | `bg-zinc-900/70` + `backdrop-blur` | All cards |
| Card (generator) | `bg-zinc-950/35` + `backdrop-blur` | Generator cards |
| Border | `border-zinc-800/70` | Card borders |
| Accent | `bg-emerald-500` | Primary buttons |
| Accent hover | `hover:bg-emerald-400` | Button hover |
| Focus ring | `focus-visible:ring-emerald-400/30` | All inputs and buttons |
| Body text | `text-zinc-100` | Primary text |
| Muted text | `text-zinc-400` | Labels, hints, helper text |
| Code text | `text-emerald-300/95` | Pine Script output |
| Code bg | `bg-black/55` | Code container |
| Error bg | `bg-rose-500/10` | Error state background |
| Error border | `border-rose-500/30` | Error state border |
| Error text | `text-rose-200` | Error message text |
| Warning | `text-amber-400` | Char count warning, stream badge |

### Typography

| Element | Font | Class |
|---|---|---|
| Body / UI | Inter | `font-sans` (`--font-sans`) |
| Headings / landing brand | Syne | `font-heading` (`--font-heading` / `--font-syne`) |
| All code | Geist Mono | `font-mono` (`--font-geist-mono`) |
| Landing hero | Syne, responsive | `text-3xl` → `text-6xl` range |
| Card titles | — | `text-xl font-semibold` |
| Labels | — | `text-sm text-zinc-400` |
| Helper text | — | `text-xs text-zinc-400` |

---

## 12. Component Specs

### PromptTemplates ✅ Exists

```
Layout:      flex flex-wrap gap-2
Default:     rounded-full border border-zinc-700/70 bg-zinc-900/50 px-3 py-1 text-xs
Hover:       hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300
Active:      border-emerald-500/70 bg-emerald-500/15 text-emerald-300
Behavior:    clicking a pill fills the textarea — user can still edit freely
```

**Presets** (8):
1. 5m Momentum Breakout
2. RSI Divergence Reversal
3. VWAP Bounce Scalper
4. Opening Range Breakout
5. EMA Crossover Trend Follow
6. Gap-and-Go Day Trade
7. Bollinger Band Squeeze
8. Pre-Market High Break

---

### Model Selector ✅ Exists

```
Layout:      segmented control — 3 buttons inline
Active:      border-emerald-500/70 bg-emerald-500/15 text-emerald-300
Inactive:    text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50
Below:       description text for selected model (e.g. "Best quality, slower")
Default:     Reasoning (grok-4-1-fast-reasoning)
```

---

### Output Card Header — Element Order

Left cluster → Right cluster (buttons):
```
"Output"  |  Validator badge (post-stream)  |  "Streaming" badge (while generating)  |  Generation stats (post-stream)
     …    |  [Stop]  |  Download .pine  |  Copy
```

- **Streaming** badge: only while `isGenerating`
- **Stop** button: only during streaming when `generatedScript` is non-empty
- **Validator badge**: after stream ends — green "Valid Pine Script v5 ✓" or amber "Review needed"
- **Generation stats**: `Generated in {seconds}s · ~{script.length/4} tokens` — only when idle with script
- **Download .pine** / **Copy**: only when `generatedScript && !isGenerating`

---

### Download Button ✅ Phase 1

```typescript
// Blob approach — no extra dependencies; button label: "Download .pine"
const handleDownload = () => {
  const blob = new Blob([generatedScript], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `strategy-${Date.now()}.pine`;
  a.click();
  URL.revokeObjectURL(url);  // ← always revoke to avoid memory leak
  toast.success('Script downloaded.');
};
```

---

### Script Validator Badge ✅ Phase 1

Implemented in `components/strategy/ScriptOutput.tsx` as `validateScript()` returning `ValidationResult`:

```typescript
export type ValidationResult = {
  hasVersion: boolean;
  hasDeclaration: boolean;
  hasAlert: boolean;
  bracketsMatch: boolean;
  isValid: boolean;
};

// hasAlert: alertcondition( OR alert( — matches system prompt using alert() for tiers
// isValid: all four checks true — displayed in StrategyForm output header
```

---

### Live Character Count ⬜ Phase 3

```
Position:  below textarea, right-aligned
Format:    "{count} / 1500"
Colors:
  0–1199:   text-zinc-400
  1200–1399: text-amber-400
  1400–1500: text-rose-400
Behavior:  Generate button disabled when count >= MAX_PROMPT_LENGTH (1500)
```

---

### ScriptHistory Drawer ✅ Phase 2

```
Component:   shadcn Sheet (slides in from left)
Trigger:     "History" button in page header — clock icon (lucide-react)
Width:       w-80 desktop / full-width mobile
Entry shows: name (editable inline), date, prompt preview (truncated ~60 chars), version badge
Actions:     Load · Rename · Delete
Empty state: "No saved scripts yet. Generate your first one."
Max entries: 50 (FIFO — oldest removed when limit exceeded)
```

---

### RefineChat ✅ Phase 2

```
Position:    directly below output code area (above Separator + three chips); hidden during Generate streaming
Title:       "Refine this script with Grok"
Behavior:    POST /api/refine-script — stateless script + instruction + model; streams full replacement script
Versioning:  each successful refinement saves new SavedScript: version = lastVersion + 1, parentId = root id (v1 entry)
Examples:    "Add trailing stop after 1R", "Switch to strategy()", "Add short signals", "Change timeframe to 1h"
```

---

## 13. Generator Page Layout

```
Route:       /generate
Max width:   max-w-6xl mx-auto px-6
Grid:        lg:grid-cols-[1fr_1.05fr] gap-6 lg:gap-8
Mobile:      single column (output below inputs)

Left panel elements (top → bottom):
  1. PromptTemplates pill grid
  2. Strategy textarea (8 rows, resize-none)
  3. Char counter inline with strategy label (`{count} / 1500`, color thresholds)
  4. Model selector segmented control
  5. "Advanced Options" collapsible (StructuredInputs)
  6. Balance input + Generate button (grid row)
  7. "Improve My Prompt" secondary button
  8. Error display

Right panel elements (top → bottom):
  1. Output card header (title, validator/streaming/stats, Stop, Download .pine, Copy)
  2. Subheader description text
  3. Code area (max-h-[640px] desktop / max-h-[400px] mobile, overflow-auto)
  4. RefineChat (when script present or refine in progress; not during Generate stream)
  5. Separator
  6. 3 info chips (Alert tiers · Auto lines · Risk rules)
```

---

## 14. Landing Page Layout

```
Route:        /
Max width:    max-w-7xl mx-auto px-6
Scroll:       document-level — no overflow-x-hidden on page shell
Sticky nav:   bg-zinc-950/80 backdrop-blur-md + emerald scroll progress line

Sections (top → bottom):
  1. LandingNavbar    — sticky, logo left, "Open App" right, scroll progress bar
  2. LandingHero      — badge, headline, subtitle, CTAs, terminal mock (strategy.pine)
  3. LandingFeatureGrid — 4-block bento: Streaming · Alerts · SL/TP · Risk Sizing
  4. LandingHowItWorks  — "From thought to trade in 15 seconds." + 3 steps
  5. LandingCodePreview — Pine Editor chrome + syntax-styled sample
  6. LandingCta         — "Ready to script smarter?" + Launch Generator Now
  7. LandingFooter      — "Built for traders, powered by Grok" + copyright

All CTAs link to: /generate
```

---

## 15. Accessibility Checklist

- [ ] All interactive elements have `aria-label` or visible label
- [ ] Generate button: `aria-busy={isGenerating}`
- [ ] Output code area: `aria-live="polite"`
- [ ] Char counter: `aria-live="polite"`
- [ ] Focus rings: `focus-visible:ring-emerald-400/30` on all inputs and buttons
- [ ] Color never the sole error indicator — always paired with visible text
- [x] Keyboard: `Ctrl+Enter` triggers generate (implemented; Phase 3 may add palette shortcuts)

---

## 16. Security Checklist

- [ ] All API keys in `.env.local` — never in source code
- [ ] `.env.local` in `.gitignore`
- [ ] `.env.example` committed with placeholder values only
- [ ] Zod schema validated on every API route **before** any LLM call
- [ ] `MAX_PROMPT_LENGTH` enforced client-side (disabled button) AND server-side (Zod)
- [ ] Sanitized error messages only — no raw LLM errors or stack traces to client
- [ ] `Content-Security-Policy` header added in `next.config.ts`
- [ ] No user-supplied strings interpolated directly into system prompt without length check
- [ ] Rate limiting per IP (Phase 1: optional middleware — Phase 4: Upstash required)
- [ ] localStorage access always wrapped in `try/catch`

---

*This file is the implementation companion to `PRD_.md`. Between the two files, nothing about GrokTS should be undocumented.*
