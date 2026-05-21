# 46 — Script Collection Assignment Route

Implement the mutation surface for assigning or clearing a script's collection.
This spec owns script-to-collection linking only.

## Prerequisites

- `44-collections-data-contract.md` is complete
- `45-collections-crud-route.md` is complete

## Goal

Allow a user to place a saved script into one of their collections or remove it
from any collection.

## Route

Prefer a dedicated narrow route:

- `PATCH /api/scripts/[scriptId]/collection`

## Request Contract

```ts
{
  collectionId: number | null
}
```

## Rules

- validate the body with Zod
- verify the script belongs to the user
- if `collectionId` is non-null, verify that collection also belongs to the user
- allow `null` to clear assignment

## Scope Limits

- no collection CRUD UI
- no search/filter UI
- no tag or star mutation

## Check When Done

- scripts can be assigned or unassigned safely
- cross-user collection assignment is impossible
- updated script payload returns the new `collectionId`
