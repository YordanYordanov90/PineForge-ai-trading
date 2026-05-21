# 37 — Starred Scripts Mutation Route

Implement the backend mutation surface for starring and unstarring a script.
This spec owns the mutation endpoint only.

## Prerequisites

- `36-starred-scripts-data-contract.md` is complete

## Goal

Allow an authenticated user to toggle the starred state of one of their own
saved scripts.

## Route

Prefer a dedicated narrow route:

- `PATCH /api/scripts/[scriptId]/star`

This keeps the existing rename route focused and avoids mixing unrelated patch
payloads.

## Request Contract

```ts
{
  isStarred: boolean
}
```

Rules:

- validate with Zod
- reject invalid script ids
- enforce ownership before update

## Response Contract

Return the updated saved-script payload in the same shape used by the rest of
the history API, including `isStarred`.

## Security Requirements

- require Clerk session
- confirm the script belongs to the current DB user
- return sanitized JSON errors only

## Scope Limits

- no UI work
- no filtering/search work
- no collections/tags updates in this route

## Check When Done

- dedicated star toggle route exists
- only owners can change star state
- updated response returns the persisted `isStarred` value
