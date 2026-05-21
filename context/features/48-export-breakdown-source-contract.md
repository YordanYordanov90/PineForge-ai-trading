# 48 — Export Breakdown Source Contract

Define what content feeds **Export to Notion / Obsidian**. This spec owns the
export source contract only.

## Goal

Make export deterministic by choosing one canonical content source and metadata
shape before building formatting or UI.

## Source of Truth

Use the Breakdown content and script metadata already available in the generator
experience.

Recommended export payload includes:

- script title
- original prompt
- model
- generated script body
- breakdown markdown/content
- structured inputs such as market, timeframe, direction, indicators, RR
- created/updated timestamps when available

## Rules

- do not require new AI calls for export
- do not require DB persistence for the export artifact itself
- exported content should be reproducible from existing state

## Scope Limits

- no markdown serializer logic
- no download/copy UI
- no Notion OAuth or API integration

## Check When Done

- export source fields are clearly defined
- later export specs can depend on one canonical payload
