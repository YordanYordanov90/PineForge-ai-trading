# Grok Trading Strategy Generator — Development Roadmap

**Project Goal**: Transform the current app into a **premium-feeling**, professional trading tool that traders would actually use daily.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn/ui · Vercel AI SDK · xAI Grok

---

## Environment Variables

All secrets must live in `.env.local` — never hardcoded, never committed to git.

```env
# Required now
XAI_API_KEY=your_xai_key_here

# Required Phase 4
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=           # Neon Postgres connection string
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Reference `.env.example` with placeholder values should be committed to the repo.

---

## AI Model

Canonical model name (used in all API routes, referenced here once):

```ts
// lib/constants.ts
export const GROK_MODEL = 'grok-3-mini-fast'; // update here if xAI renames
```

---

## Current Status

| # | Task | Phase | Status |
|---|---|---|---|
| 1 | Proper metadata + favicon (`app/layout.tsx`) | Phase 1 | ✅ Done |
| 2 | Toast notifications via `sonner` (copy, error, stop) | Phase 1 | ✅ Done |
| 3 | Landing page (separate route `/`) | Phase 1 | ✅ Done |
| 4 | Strategy templates / presets (clickable grid) | Phase 1 | ✅ Done |
| 5 | Syntax highlighting for Pine Script output (`shiki`) | Phase 1 | ✅ Done |
| 6 | Download as `.pine` file | Phase 1 | ⬜ Pending |
| 7 | Advanced input fields (timeframe, market, indicators) | Phase 1 | ⬜ Pending |
| 8 | Strategy history in `localStorage` | Phase 2 | ⬜ Pending |
| 9 | Dark / Light theme toggle (`next-themes`) | Phase 3 | ⬜ Pending |
| 10 | Refine / follow-up chat (conversational iteration loop) | Phase 2 | ⬜ Pending |
| 11 | Multi-tab output (Script + Explanation + Setup Checklist) | Phase 2 | ⬜ Pending |
| 12 | Script validator / linter badge | Phase 3 | ⬜ Pending |
| 13 | Generation stats (time + token estimate) | Phase 3 | ⬜ Pending |
| 14 | Live character / word count on textarea | Phase 3 | ⬜ Pending |

---

## Recommended Project Structure

```
app/
├── (landing)/
│   └── page.tsx                    (exists — landing page)
├── app/
│   └── page.tsx                    (exists — generator /app route)
├── api/
│   ├── generate/route.ts           (exists)
│   ├── improve-prompt/route.ts     (Phase 1 — task 7)
│   └── explain-script/route.ts     (Phase 2 — task 11)
├── layout.tsx
components/
├── strategy/
│   ├── StrategyForm.tsx            (exists)
│   ├── PromptTemplates.tsx         (Phase 1 — task 4)
│   ├── StructuredInputs.tsx        (Phase 1 — task 7)
│   ├── ScriptOutput.tsx            (Phase 1 — task 5 & 6)
│   ├── ScriptHistory.tsx           (Phase 2 — task 8)
│   └── RefineChat.tsx              (Phase 2 — task 10)
├── ui/
│   └── sonner.tsx                  (exists)
hooks/
│   └── useScriptHistory.ts         (Phase 2 — task 8)
lib/
│   ├── utils.ts                    (exists)
│   ├── constants.ts                (add now — model name, limits)
│   └── types.ts                    (Phase 2 — task 8)
```

---

## Phase 1 — Quick Wins + Instant Premium Feel

**Goal**: Make the app feel polished and professional immediately.
**Estimated effort**: 2–3 days

### Task 1 — Metadata + SEO ✅ Done

### Task 2 — Toast Notifications ✅ Done

### Task 3 — Landing Page ✅ Done
- Separate marketing page at `/`
- Hero: "Describe it. Grok writes it. You trade it."
- Feature grid: Streaming Generation, 3-Tier Alerts, Auto SL/TP, Risk Sizing
- "How it works" 3-step section
- Production-ready output preview (static code screenshot)
- CTA: "Start Generating" → links to `/app`

### Task 4 — Strategy Templates / Presets  ✅ Done
- New component: `components/strategy/PromptTemplates.tsx`
- Clickable pill/card grid above the strategy textarea — 8–10 presets:
  - "5m Momentum Breakout"
  - "RSI Divergence Reversal"
  - "VWAP Bounce Scalper"
  - "Opening Range Breakout"
  - "EMA Crossover Trend Follow"
  - "Gap-and-Go Day Trade"
  - "Bollinger Band Squeeze"
  - "Pre-Market High Break"
- Clicking a preset fills the textarea (user can still edit)

### Task 5 — Syntax Highlighting ✅ Done
- Library: `shiki` (lightweight, SSR-safe, zero runtime)
- ⚠️ **Important**: `shiki` is a static highlighter — it cannot highlight mid-stream.
  Highlight only **after** `isGenerating` transitions to `false`. Use a `useEffect` that
  watches `[isGenerating, generatedScript]` and runs highlight pass when streaming ends.
- Extract output panel into `components/strategy/ScriptOutput.tsx`
- Use `pine` grammar or `javascript` fallback
- Preserve emerald/dark theme — override shiki theme tokens to match `emerald-300` on `black/55`

### Task 6 — Download as `.pine` File ⬜ Pending
- Add "Download" button next to "Copy" in the output card header
- `Blob` + `URL.createObjectURL` — no extra dependencies
- Filename: `strategy-{timestamp}.pine`
- Disabled when `!generatedScript || isGenerating`
- Cleanup: call `URL.revokeObjectURL` after click to avoid memory leak
- Toast on success: "Script downloaded."

### Task 7 — Advanced Input Fields ⬜ Pending
- New component: `components/strategy/StructuredInputs.tsx`
- New API route: `app/api/improve-prompt/route.ts`
- Fields (optional, collapsed by default behind "Advanced Options" toggle):
  - **Timeframe** — Select: `1m / 5m / 15m / 1h / 4h / 1D`
  - **Market type** — Select: `Stocks / Crypto / Forex / Futures`
  - **Direction** — Select: `Long only / Short only / Both`
  - **Indicators** — Multi-select: `RSI / MACD / VWAP / EMA / Bollinger`
  - **Risk/Reward** — Slider: `1:1 → 1:5`
- Append selected values to the Grok prompt string automatically
- "Improve My Prompt" button calls `/api/improve-prompt` to rewrite user's raw description

---

## Phase 2 — Core Product Value: History & Iteration

**Goal**: Turn the tool into something traders return to daily.
**Estimated effort**: 2–3 days

### Task 8 — Strategy History in localStorage ⬜ Pending
- New hook: `hooks/useScriptHistory.ts`
- New component: `components/strategy/ScriptHistory.tsx` — slide-in shadcn `Sheet` drawer
- Auto-saves every completed generation with metadata
- Features: view, reload into form, rename, delete
- Limit: keep last 50 entries to avoid localStorage bloat

**Type definition** (`lib/types.ts`):
```typescript
export type SavedScript = {
  id: string;
  name: string;
  prompt: string;
  balance: string;
  script: string;
  createdAt: string;
  version: number;
  parentId?: string;
  market?: string;
  timeframe?: string;
  direction?: string;
};
```

### Task 10 — Refine / Follow-Up Chat ⬜ Pending
- New component: `components/strategy/RefineChat.tsx`
- Appears below output card after first generation
- User types follow-up: "Add trailing stop after 1R", "Switch to strategy()", "Add short signals"
- Maintains full conversation context array — streams next version
- Each refinement saved to history as a new version (v2, v3…) linked via `parentId`

### Task 11 — Multi-Tab Output ⬜ Pending
- Replace single `<pre>` block with shadcn `Tabs` component
- **Pine Script** — syntax-highlighted code (Task 5)
- **Strategy Breakdown** — plain-English explanation from Grok
- **Setup Checklist** — step-by-step TradingView setup instructions
- "Breakdown" and "Checklist" load on-demand via `/api/explain-script/route.ts`

---

## Phase 3 — Premium Polish & Trust

**Goal**: Make it feel like a real SaaS product.
**Estimated effort**: 2–3 days

### Task 9 — Dark / Light Theme Toggle ⬜ Pending
- Library: `next-themes`
- Toggle button in header (sun/moon icon via `lucide-react`)
- Preference persisted in `localStorage`
- Tailwind CSS v4: use `dark:` variants

### Task 12 — Script Validator / Linter Badge ⬜ Pending
- Post-generation heuristics:
  - Starts with `//@version=5`
  - Contains `indicator()` or `strategy()`
  - Matching bracket count
  - At least one `alertcondition()` call
- Show green "Valid Pine Script v5" badge or amber warning in output header

### Task 13 — Generation Stats ⬜ Pending
- Track `startTime` at start of `generate()`
- On stream end: compute elapsed ms, estimate token count from `script.length / 4`
- Display: "Generated in 8.3s · ~420 tokens" below output

### Task 14 — Live Character / Word Count ⬜ Pending
- Below strategy textarea: `{charCount} chars · {wordCount} words · {remaining} remaining`
- Max: 1500 characters
- Color: `zinc-400` → `amber-400` at 1200 → `rose-400` at 1400

---

## Phase 4 — SaaS Layer

**Goal**: Monetize and scale. Add after auth + DB are in place.

- **Clerk auth** — sign in, usage limits (free: 3 generations/day)
- **Upstash rate limiting** — per-user, per-IP fallback
- **Neon Postgres + Drizzle** — replace localStorage history
- **Public script gallery** — `/strategy/[slug]` shareable routes
- **TradingView Alert Webhook builder** — generate webhook payload alongside Pine Script

---

## Security & Best Practices

Apply to all API routes:

- Max prompt: **1500 chars** enforced via Zod schema
- Balance validation: `z.string().regex(/^\$?[\d,]+(\.\d{1,2})?$/)`
- Strong system prompt: only Pine Script v5 output, refuse off-topic requests
- Never expose raw LLM errors to client — sanitize all error messages
- Rate limiting per IP (Phase 1 optional → Phase 4 required via Upstash)
- All API keys in `.env.local`, never in source code

---

## Bonus Ideas (Nice-to-Have Later)

| Idea | Notes |
|---|---|
| `Ctrl+Enter` keyboard shortcut | Submit without clicking Generate |
| Command palette (`Ctrl+K`) | Quick access to templates, history, actions |
| Strategy comparison | Two scripts side-by-side diff view |
| PDF export | Strategy + code + risk table as formatted PDF |
| API key management | Users bring their own xAI key to bypass limits |
| Web Share API | Mobile share button for generated scripts |
