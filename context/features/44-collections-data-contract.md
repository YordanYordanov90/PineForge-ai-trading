# 44 — Collections Data Contract

Define how **Strategy Collections / Folders** use the existing schema. This spec
owns data boundaries only.

## Goal

Reuse the committed `collections` table and `scripts.collectionId` relation so
users can organize scripts into named groups.

## Existing Schema

Use:

- `collections`
- `scripts.collectionId`

No new migration is required unless the live database differs from the committed
Drizzle state.

## Collection Rules

- collection names are per-user
- names should be trimmed
- duplicate names for the same user should be prevented at the app layer unless a
  future migration adds a DB unique index

## Scope Limits

- no CRUD route implementation
- no UI
- no script-assignment mutation

## Check When Done

- existing schema is documented as the source of truth
- per-user naming and ownership rules are clear
