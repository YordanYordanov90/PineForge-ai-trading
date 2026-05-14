# Code Standards

## General

- Keep modules small and single-purpose — one component, one job
- Fix root causes, do not layer workarounds
- Do not mix unrelated concerns in one component or route
- Preserve existing patterns — do not refactor unrelated code during feature work
- No commented-out code unless explicitly noted as temporary
- No unused imports or variables

## TypeScript

- Strict mode required throughout — no exceptions
- No `any` — use explicit interfaces, discriminated unions, or `unknown`
- Validate all external input (API request bodies, LLM outputs) at system
  boundaries before trusting it
- Use `satisfies` operator and inferred return types where appropriate
- Define interfaces for all props, API responses, and data models
- Types and interfaces live in `lib/types.ts` unless component-scoped

## Next.js

- Default to Server Components — use `"use client"` only when the component
  needs interactivity, hooks, or browser APIs
- Keep route handlers focused on a single responsibility
- API routes: validate with Zod → run logic → return consistent response shape
- Never use `getServerSideProps` or Pages Router patterns
- Use Server Actions for simple form mutations where applicable

## Styling

- Tailwind CSS v4 only — no inline styles, no CSS modules
- All theme configuration via `@theme` directive in `globals.css` — no `tailwind.config.ts`
- Use established color tokens from `ui-context.md` — no hardcoded hex values
- Dark-first — light mode only in Phase 3 via next-themes
- `components/ui/*` — do not hand-edit after shadcn CLI generation

## API Routes

- Parse and validate request body with the relevant Zod schema before any logic
- Never pass raw request data to the LLM
- Enforce `MAX_PROMPT_LENGTH` server-side (Zod) regardless of client enforcement
- Return sanitized, user-friendly error messages only — no stack traces, no raw
  LLM errors, no internal message strings
- All secrets via `process.env` only — never referenced in client components

## Data and Storage

- Script history lives in localStorage Phase 1–3 — all access in `useScriptHistory`
  hook, always wrapped in `try/catch`
- Phase 4: history migrates to Neon Postgres via Drizzle ORM — schema in
  `drizzle/schema.ts`, migrations versioned and tracked in git
- Never store large generated content directly in the database — store metadata
  and reference content separately if needed at scale
- `drizzle-kit push` is for local prototyping only — never in production

## File Organization

- `app/api/` — Route handlers only. One folder per endpoint.
- `components/strategy/` — All generator page UI components
- `components/landing/` — All marketing page components
- `components/ui/` — shadcn primitives only (CLI-managed, do not edit)
- `hooks/` — Custom React hooks. One hook per concern.
- `lib/` — Shared utilities, types, validation schemas, constants, prompts
- `lib/prompts/` — System prompts for LLM calls
- Component files: PascalCase (`StrategyForm.tsx`)
- Hook files: camelCase (`useScriptHistory.ts`)
- Lib/util files: kebab-case (`pine-generate-system.ts`)
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase

## Constants

All shared constants live in `lib/constants.ts`:
- `MAX_PROMPT_LENGTH = 1500`
- `MAX_HISTORY_ENTRIES = 50`
- `CHAR_WARNING_THRESHOLD = 1200`
- `CHAR_DANGER_THRESHOLD = 1400`
- `DEFAULT_MODEL = 'grok-4-1-fast-reasoning'`
- `DEFAULT_RR_RATIO = 2`
- `REFINE_MAX_OUTPUT_TOKENS = 2000`
