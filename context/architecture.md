# Architecture Context

## Stack

| Layer          | Technology                          | Role                                      |
| -------------- | ----------------------------------- | ----------------------------------------- |
| Framework      | Next.js 16 (App Router)             | Routing, SSR, API routes, layout          |
| Language       | TypeScript 5 (strict mode)          | Type safety throughout                    |
| Styling        | Tailwind CSS v4 + shadcn/ui         | UI components and design tokens           |
| AI             | Vercel AI SDK + @ai-sdk/xai (Grok)  | Streaming Pine Script generation          |
| Validation     | Zod                                 | All API input validation                  |
| Syntax HL      | shiki                               | Post-stream code highlighting only        |
| Notifications  | sonner                              | Toast feedback                            |
| History        | localStorage (Phase 1–3)            | Client-side script persistence            |
| Auth           | Clerk (Phase 4)                     | User identity and session management      |
| Database       | Neon Postgres + Drizzle ORM (Ph 4)  | Persistent script history, user data      |
| Rate limiting  | Upstash Redis (Phase 4)             | Per-user and per-IP quota enforcement     |
| Deployment     | Vercel                              | Hosting, edge functions, env management   |

## System Boundaries

- `app/api/` — All server-side logic. Validates with Zod, calls Grok, returns
  streaming or JSON responses. Never exposes raw errors or API keys.
- `app/(landing)/` — Marketing page. Static, no auth required.
- `app/generate/` — Core generator UI. Client-heavy (streaming, localStorage,
  interactive state). No auth required Phase 1–3.
- `components/strategy/` — All generator UI components. Own the form, output,
  history, and refine chat.
- `components/landing/` — All marketing page components.
- `lib/` — Shared utilities: types, validation schemas, constants, prompt templates.
- `hooks/` — Custom React hooks. `useScriptHistory` owns all localStorage access.

## Storage Model

- **localStorage**: Script history (Phase 1–3). `SavedScript[]` keyed to a fixed
  localStorage key. Max 50 entries FIFO. All access wrapped in try/catch.
- **Neon Postgres** (Phase 4): Persistent script history per user. Replaces
  localStorage. Schema managed by Drizzle ORM with versioned migrations.

## Auth and Access Model

- Phase 1–3: No authentication. All routes are public.
- Phase 4: Clerk authentication. Free tier = 3 generations/day. Pro = unlimited.
  Per-user rate limiting enforced via Upstash Redis middleware.
  Public script sharing via `/strategy/[slug]` requires no auth to read.

## Invariants

1. **API keys never reach the client.** `XAI_API_KEY` and all future secrets
   live in `.env.local` only. Never referenced in any `"use client"` component.
2. **Zod validation before every LLM call.** No API route passes raw request
   body to Grok. All inputs parsed and validated first.
3. **shiki never runs during streaming.** Applied only after `isGenerating`
   transitions to false to prevent layout shift and hydration issues.
4. **Sanitized errors only.** Raw LLM errors, stack traces, and internal
   messages never returned to the client. All error responses are user-friendly.
5. **localStorage always try/catch.** No localStorage read or write is unwrapped.
   Silent failure with empty state is the fallback.
6. **Max prompt length enforced at both layers.** 1500 chars enforced client-side
   (disabled Generate button) AND server-side (Zod schema). One layer alone is
   not sufficient.
