# SCANNER.md — Codebase Audit Tool

## Usage
Invoke this scanner on demand. Specify a scope or run a full audit.
Never run automatically — always triggered explicitly.

---

## Scope Options
Pass one scope per scan. Default is `full`.

| Scope | What it covers |
|---|---|
| `full` | All categories below |
| `security` | Security issues only |
| `performance` | Performance issues only |
| `quality` | Code quality + structure only |
| `components` | Component splitting opportunities only |

---

## Instructions

Scan this Next.js codebase and report **only actual issues present in the code**.

### Rules Before Scanning
- **Only report what exists** — do not report missing features as issues
- **Auth**: If authentication is not implemented, do not report its absence as a vulnerability
- **Env files**: Do not report missing `.env` files — they are intentionally in `.gitignore`. Instead check for hardcoded secrets, API keys exposed in client-side code, or `NEXT_PUBLIC_` variables that should be private
- **Incomplete features**: If a feature is stubbed or marked TODO, skip it unless it introduces an active risk
- **No noise** — if you are uncertain, omit it. Quality over quantity

---

## Scan Categories

### 1. Security
- Hardcoded secrets, API keys, tokens in source files
- `NEXT_PUBLIC_` env vars exposing sensitive values to the client
- Unprotected API routes (missing auth checks, missing rate limiting)
- Missing input validation (no Zod or equivalent on request bodies)
- SQL injection risks or raw query concatenation
- CSRF vulnerabilities in Server Actions or API routes
- Prompt injection risks in AI/LLM integrations
- Unvalidated LLM outputs rendered directly to the UI
- Insecure cookie flags (missing `httpOnly`, `secure`, `sameSite`)
- Exposed internal errors or stack traces in API responses

### 2. Performance
- N+1 query patterns in data fetching
- Missing database indexes on frequently queried columns
- Unnecessary `'use client'` on components that have no interactivity
- Large client bundles (heavy imports not lazy-loaded)
- Blocking data fetches that could run in parallel
- Missing `loading.tsx` or Suspense boundaries on slow routes
- Images missing `next/image` or `width`/`height` attributes

### 3. Code Quality
- Functions exceeding 50 lines
- Components doing more than one job
- Duplicated logic that should be extracted to a utility or hook
- `any` types without justification
- Unused imports, variables, or dead code
- Inconsistent error handling (some routes return errors, others throw)
- Missing `{ success, data, error }` return pattern in Server Actions

### 4. Component Structure
- Large components that can be split into focused sub-components
- Logic that belongs in a custom hook, not a component
- Repeated JSX patterns that should be extracted into a shared component
- Client Components that wrap Server Components unnecessarily

---

## Output Format

Group findings by severity. Use this exact structure:

```
## Scan Results — [SCOPE] — [DATE]

### 🔴 Critical
- **File**: `app/api/route.ts` · **Line**: 42
  **Issue**: API key hardcoded in source
  **Fix**: Move to `.env.local` and access via `process.env.KEY_NAME`

### 🟠 High
- ...

### 🟡 Medium
- ...

### 🔵 Low
- ...

### ✅ No issues found in: [categories with clean results]
```

---

## After Scanning

Do not automatically act on findings. Present results and wait.
For quick wins, ask: *"Would you like me to add any low-risk fixes to `context/progress-tracker.md` as a new feature?"*

Only add items that are:
- Low risk (no architectural changes required)
- Self-contained (one file or one function)
- Not related to unimplemented features
