# 42 — History Search Route

Implement the read path for **Tags + Search**. This spec owns search/filter
query behavior only.

## Prerequisites

- `40-tags-data-contract.md` is complete

## Goal

Allow signed-in history queries to filter scripts by free-text search and tags.

## Route

Prefer a dedicated read endpoint instead of overloading the base history route:

- `GET /api/scripts/search`

## Query Inputs

Recommended query params:

- `q` — optional free-text string
- `tag` — optional repeated or comma-separated tag filter
- `starred` — optional boolean
- `collectionId` — optional numeric filter

## Search Behavior

Keep v1 search narrow and predictable:

- title match
- prompt metadata match if available
- tag match

Avoid broad fuzzy search work in this first unit.

## Security Requirements

- require Clerk session
- scope all results to the current user
- sanitize invalid query params

## Scope Limits

- no UI work
- no mutation logic
- no advanced ranking engine

## Check When Done

- search route exists for signed-in history
- results are user-scoped
- tag and text filters can be combined safely
