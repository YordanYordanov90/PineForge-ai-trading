# 40 — Tags Data Contract

Define the data contract for **Strategy Tags**. This spec owns storage and
validation rules only.

## Goal

Reuse the existing `scripts.tags` field so scripts can carry a small set of
user-defined labels for filtering and search.

## Existing Schema

Reuse `scripts.tags` from `drizzle/schema.ts`.

No new migration is required unless the live database is missing the committed
column.

## Tag Rules

- tags are stored as a string array
- tags are user-scoped through script ownership
- tags should be normalized before persistence

Recommended normalization:

- trim whitespace
- lower-case for storage
- de-duplicate
- reject empty values

## Suggested Constraints

- max 10 tags per script
- max 24 characters per tag

## Scope Limits

- no mutation route
- no search UI
- no collections logic

## Check When Done

- existing `tags` field is documented as the source of truth
- normalization rules are defined before route/UI work starts
