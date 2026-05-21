# 41 — Tags Mutation Route

Implement the backend mutation surface for updating script tags. This spec owns
tag persistence only.

## Prerequisites

- `40-tags-data-contract.md` is complete

## Goal

Allow authenticated users to set the normalized tag list for one of their own
scripts.

## Route

Prefer a dedicated narrow route:

- `PATCH /api/scripts/[scriptId]/tags`

## Request Contract

```ts
{
  tags: string[]
}
```

Rules:

- validate with Zod
- normalize tags server-side
- enforce ownership before update

## Response Contract

Return the updated saved-script payload including normalized `tags`.

## Scope Limits

- no search query in this step
- no UI chip editor in this step
- no collection changes

## Check When Done

- dedicated tags route exists
- tags are normalized before save
- updated response includes the final tag list
