# Software Requirements Specification (SRS)
**Grok Trading Strategy Generator**

**Version**: 1.1
**Date**: April 2026

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| AI | Vercel AI SDK + @ai-sdk/xai |
| Validation | Zod |
| Notifications | sonner |
| Syntax highlight | shiki (post-stream) |
| Auth (future) | Clerk |
| Database (future) | Neon Postgres + Drizzle ORM |
| Rate limiting (future) | Upstash Redis |

---

## 1. Functional Requirements

### 1.1 Strategy Generation — `POST /api/generate`

**Request**:
```typescript
type GenerateRequest = {
  prompt: string;   // max 1500 chars, validated server-side via Zod
  balance: string;  // e.g. "12450" or "$12,450.00"
  model: 'grok-4-1-fast-reasoning' | 'grok-4-1-fast-non-reasoning' | 'grok-4';  // defaults to 'grok-4-1-fast-reasoning'
};
```

**Behavior**:
- Validates input with Zod before calling Grok
- Streams response using Vercel AI SDK `streamText`
- System prompt enforces Pine Script v5 only output
- Never returns raw LLM errors — all errors sanitized before client response

**Response**: `text/event-stream` (streaming) or `application/json` error

---

### 1.2 Prompt Improvement — `POST /api/improve-prompt`

**Request**:
```typescript
type ImprovePromptRequest = {
  prompt: string;
  market?: 'Stocks' | 'Crypto' | 'Forex' | 'Futures';
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
  direction?: 'Long only' | 'Short only' | 'Both';
  indicators?: Array<'RSI' | 'MACD' | 'VWAP' | 'EMA' | 'Bollinger'>;
};
```

**Response**:
```typescript
type ImprovePromptResponse = {
  improvedPrompt: string;
};
```

---

### 1.3 Script Explanation — `POST /api/explain-script` (Phase 3)

**Request**:
```typescript
type ExplainScriptRequest = {
  script: string;
  mode: 'breakdown' | 'checklist';
};
```

**Response**: streaming text (plain English explanation or numbered checklist)

---

### 1.4 Script History (localStorage — Phase 3, DB — Phase 4)

- Auto-save on stream complete
- Max 50 entries in localStorage (FIFO eviction)
- Migrate to Neon Postgres in Phase 4 with same `SavedScript` shape

---

## 2. Data Models

```typescript
// lib/types.ts

export type SavedScript = {
  id: string;
  name: string;           // auto-generated from prompt first 40 chars, user-editable
  prompt: string;
  balance: string;
  script: string;
  createdAt: string;      // ISO 8601
  version: number;        // 1 for original, 2+ for refinements
  parentId?: string;      // links refined versions to original
  market?: string;
  timeframe?: string;
  direction?: string;
};

export type GenerationStats = {
  durationMs: number;
  estimatedTokens: number;  // script.length / 4 approximation
};
```

---

## 3. Validation Rules (Zod — enforce on all API routes)

```typescript
// lib/validation.ts

import { z } from 'zod';

export const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Strategy description too short')
    .max(1500, 'Strategy description exceeds 1500 character limit'),
  balance: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{1,2})?$/, 'Balance must be a valid number'),
});

export const improvePromptSchema = z.object({
  prompt: z.string().min(5).max(1500),
  market: z.enum(['Stocks', 'Crypto', 'Forex', 'Futures']).optional(),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1D']).optional(),
  direction: z.enum(['Long only', 'Short only', 'Both']).optional(),
  indicators: z
    .array(z.enum(['RSI', 'MACD', 'VWAP', 'EMA', 'Bollinger']))
    .optional(),
});
```

---

## 4. Constants

```typescript
// lib/constants.ts

export const MAX_PROMPT_LENGTH = 1500;
export const MAX_HISTORY_ENTRIES = 50;
export const CHAR_WARNING_THRESHOLD = 1200;
export const CHAR_DANGER_THRESHOLD = 1400;

export type GrokModel = {
  id: 'grok-4-1-fast-reasoning' | 'grok-4-1-fast-non-reasoning' | 'grok-4';
  label: string;
  description: string;
};

export const GROK_MODELS: GrokModel[] = [
  { id: 'grok-4-1-fast-reasoning', label: 'Reasoning', description: 'Best quality, slower' },
  { id: 'grok-4-1-fast-non-reasoning', label: 'Fast', description: 'Quick responses' },
  { id: 'grok-4', label: 'Grok-4', description: 'Most capable' },
];

export const DEFAULT_MODEL = 'grok-4-1-fast-reasoning';
```

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Generation time | < 15 seconds average |
| Prompt validation | Server-side Zod, never trust client |
| Error exposure | Never expose raw LLM or stack errors to client |
| Accessibility | WCAG 2.2 AA |
| SEO | Open Graph + Twitter card meta on all public routes |
| Mobile | Fully responsive — single column below `lg` breakpoint |
| localStorage | Serialize with `JSON.stringify`, always wrap in try/catch |
| Syntax highlight | `shiki` runs after stream ends only — not during streaming |

---

## 6. Security Checklist

- [ ] All API keys in `.env.local` — never in source code
- [ ] `.env.local` in `.gitignore`
- [ ] `.env.example` committed with placeholder values
- [ ] Zod validation on every API route before any LLM call
- [ ] Max prompt length enforced both client-side (disabled button) and server-side (Zod)
- [ ] Sanitized error messages returned to client
- [ ] Rate limiting per IP (Upstash — Phase 4, optional middleware in Phase 1)
- [ ] `Content-Security-Policy` header (add in `next.config.ts`)
- [ ] No user-supplied strings interpolated directly into system prompt without length check

---

## 7. Environment Variables Reference

```env
# .env.example — commit this file

# Required
XAI_API_KEY=your_xai_key_here

# Phase 4
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```
