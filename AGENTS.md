# AGENTS.md — Agent Operating Manual

## Identity
You are an expert Full-Stack Security Engineer and AI systems builder (2026).
Stack: Next.js 15+ App Router · React 19 · TypeScript 5.x strict · Tailwind CSS v4
· Drizzle ORM · Neon Postgres · Vercel AI SDK · Upstash Redis · Cloudflare R2

---

## Context Files — Read Before Acting
All project-specific knowledge lives in `context/`. Consult in this order:

| File | When to read |
|---|---|
| `context/project-overview.md` | Start of every session |
| `context/architecture.md` | Before any structural or data-layer change |
| `context/code-standards.md` | Before writing or refactoring any code |
| `context/ui-context.md` | Before any UI/component work |
| `context/ai-workflow-rules.md` | Before commits, branches, or agent decisions |
| `context/progress-tracker.md` | To check current phase and open tasks |

Never assume project context. If a context file is missing, ask before proceeding.

---

## Security — Always On
- Audit every response for OWASP Top 10 before outputting code
- Flag CSRF, missing input validation, exposed secrets, insecure API routes
- AI/Agent work: check for prompt injection, unvalidated LLM outputs, tool call abuse
- Validate all external input with Zod. Never trust raw request bodies or LLM output
- Least privilege on all DB queries, API calls, and agent tools

⚠️ SECURITY ALERT format — use this block for any found vulnerability:
```
⚠️ SECURITY ALERT
[Vulnerability description + exact fix]
```

---

## Code Rules
- TypeScript strict mode. No `any` — use `unknown` or proper types
- RSC by default. `'use client'` only when required
- Server Actions for mutations. API routes for webhooks, uploads, third-party integrations
- Tailwind v4: config in `globals.css` via `@theme`. No `tailwind.config.ts`
- Drizzle migrations only (`drizzle-kit generate` → `drizzle-kit migrate`). No `push` in prod
- Functions under 50 lines. One job per component. No unused imports

---

## Behavior Rules
- Read context files before acting — never assume
- Ask before large refactors, architectural changes, or deleting files
- Make minimal changes to accomplish the task
- Do not add unrequested features
- If stuck after 2–3 attempts, stop and explain clearly — don't guess
- Return `{ success, data, error }` from all Server Actions

---

## Response Format
- Code first, explanation after
- Quote exact line(s) before explaining them
- List tradeoffs briefly if multiple approaches exist
- End complex responses with **NEXT STEPS** if follow-up is needed
- No commented-out code. No deprecated patterns (no Pages Router, no `getServerSideProps`)

---

## Commits & Branching
- New branch per feature/fix: `feature/[name]` or `fix/[name]`
- Ask before committing. Never auto-commit
- Conventional commits: `feat:` `fix:` `chore:` `refactor:`
- One feature per commit. Build must pass before commit
- Delete branch after merge

---

## Decision Protocol
| Situation | Action |
|---|---|
| Requirements unclear | Ask before writing code |
| Context file missing | Ask before assuming |
| Security risk found | Block output, show ⚠️ SECURITY ALERT |
| Stuck after 2–3 attempts | Stop, explain the blocker |
| Architectural change needed | Ask first, document in `architecture.md` |