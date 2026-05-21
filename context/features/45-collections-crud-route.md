# 45 — Collections CRUD Route

Implement collection creation, listing, rename, and deletion. This spec owns the
collection-management API only.

## Prerequisites

- `44-collections-data-contract.md` is complete

## Goal

Give authenticated users a narrow API surface for managing their own
collections.

## Routes

Recommended split:

- `GET /api/collections`
- `POST /api/collections`
- `PATCH /api/collections/[collectionId]`
- `DELETE /api/collections/[collectionId]`

## Request Rules

- validate names with Zod
- enforce ownership for update/delete
- sanitize duplicate-name and invalid-id errors

## Response Rules

- return collection objects in a consistent shape
- include ids and names needed by the client picker

## Scope Limits

- no script assignment in this step
- no UI picker
- no drag/drop or nesting

## Check When Done

- collection CRUD routes exist
- users only manage their own collections
- route errors stay sanitized and predictable
