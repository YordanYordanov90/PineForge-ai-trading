# 38 — Starred Scripts History Query

Adapt history loading so starred scripts can be presented reliably in signed-in
mode. This spec owns query and ordering behavior only.

## Prerequisites

- `36-starred-scripts-data-contract.md` is complete

## Goal

Make sure history reads include star state and support a future UI that can
surface starred scripts separately or first.

## Scope

This step owns:

- script list query behavior for signed-in users
- row-to-client mapping of `isStarred`
- deciding whether starred rows are grouped or simply available to the client

This step does **not** own:

- mutation endpoints
- UI controls

## Recommended Approach

Keep the initial API shape simple:

- return all scripts with `isStarred`
- let the client decide whether to group starred scripts visually

Avoid prematurely changing sort order if it would disrupt existing recency-based
history expectations.

## Check When Done

- history payload includes `isStarred`
- signed-in clients can distinguish starred vs non-starred scripts
- no localStorage-only assumption remains in the signed-in path
