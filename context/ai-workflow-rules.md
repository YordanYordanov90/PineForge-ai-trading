# AI Workflow Rules

## Approach

Build PineForge incrementally using a spec-driven workflow. Context files define
what to build, how to build it, and the current state of progress. Always
implement against these specs — do not infer or invent behavior not defined here.
The feature-specs folder contains numbered `.md` files — implement them in order.

## Scoping Rules

- Work on one feature unit at a time
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step
- Do NOT commit without explicit permission and until `npm run build` passes

## When to Split Work

Split an implementation step if it combines:

- UI changes and API route changes (do UI first, wire API separately)
- Multiple unrelated components in one pass
- Behavior not clearly defined in the context files
- A database change and a UI change simultaneously

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files
- If a requirement is ambiguous, resolve it in the relevant context file before implementing
- If a requirement is missing, add it as an open question in `progress-tracker.md`
  before continuing

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn CLI-generated primitives, do not hand-edit
- `lib/validation.ts` — Zod schemas are the contract; only change with explicit approval
- `lib/config/constants.ts` — constants are referenced across the app; changes have wide impact
- `.env.local` — never touch, never read, never log

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes affect:

- System architecture or storage model (`architecture.md`)
- Design tokens or component patterns (`ui-context.md`)
- Code conventions or file organization (`code-standards.md`)
- Feature progress or open questions (`progress-tracker.md`)

## Branching

- New branch for every feature or fix
- Naming: `feature/[feature-name]` or `fix/[fix-name]`
- Ask to delete the branch once merged to main

## Commits

- Ask before committing — do not auto-commit
- Conventional commit format: `feat:`, `fix:`, `chore:`, `refactor:`
- One feature or fix per commit — keep commits focused
- Never include "Generated with Claude / Cursor / OpenAI" in commit messages

## Communication Rules

- Ask before large refactors or architectural changes
- Do not add features not in the project spec
- Never delete files without clarification
- Make minimal changes to accomplish the task
- Do not refactor unrelated code unless asked
- If something is not working after 2–3 attempts, stop and explain the issue
  clearly — do not keep trying random fixes

## Before Moving to the Next Feature Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npm run build` passes with no errors or type errors
5. The feature branch is merged and deleted

## Code Review Checklist

Review AI-generated code for:

- **Security**: auth checks, input validation, no secrets in client code
- **Invariants**: all 6 invariants in `architecture.md` respected
- **Performance**: no unnecessary re-renders, no N+1 patterns
- **Logic**: edge cases handled (empty state, error state, loading state)
- **Patterns**: matches existing codebase conventions in `code-standards.md`
