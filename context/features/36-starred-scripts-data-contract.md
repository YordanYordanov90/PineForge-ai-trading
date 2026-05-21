# 36 — Starred Scripts Data Contract

Define the data contract for **Pinned / Starred Scripts**. This spec owns the
storage audit and response shape only.

## Goal

Use the existing script persistence layer so users can mark important scripts and
keep them visible beyond normal history churn.

## Existing Schema

Reuse the existing `scripts.isStarred` boolean in `drizzle/schema.ts`.

No migration is required unless an audit finds the production database is out of
sync with the committed Drizzle migrations.

## Scope

This step owns:

- confirming the existing column is the source of truth
- response field naming for client consumption
- ordering expectations when starred items are shown in history

This step does **not** own:

- mutation route logic
- history query changes
- UI controls

## Contract Rules

- `isStarred` is the canonical persisted field
- client models should expose `isStarred: boolean`
- toggling star state must update `updatedAt`
- starred state is per-user because script ownership is already per-user

## History Behavior

When the UI later adds a starred section or filter, starred scripts must not be
lost simply because local FIFO history behavior existed in earlier phases.

Signed-in behavior should rely on DB rows, not localStorage eviction rules.

## Check When Done

- existing `isStarred` field is documented as the source of truth
- no unnecessary migration is introduced
- downstream specs can depend on a stable boolean field
