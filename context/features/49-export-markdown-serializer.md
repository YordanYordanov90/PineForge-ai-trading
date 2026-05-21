# 49 — Export Markdown Serializer

Implement the utility that turns PineForge strategy data into clean Markdown for
Notion and Obsidian. This spec owns formatting only.

## Prerequisites

- `48-export-breakdown-source-contract.md` is complete

## Goal

Generate one normalized Markdown document that works well both as an Obsidian
note and as a pasted/imported Notion page.

## Suggested File

- `lib/export/strategy-markdown.ts`

## Required Sections

- title
- strategy metadata
- original prompt
- breakdown
- Pine Script code block

Optional if already available without new AI work:

- alert templates summary
- health score summary
- backtesting summary excerpt

## Rules

- deterministic formatting
- stable heading order
- fenced code block for Pine Script
- no provider-specific markdown variants in this first step

## Scope Limits

- no UI actions
- no file-writing route
- no direct Notion API calls

## Check When Done

- serializer outputs one predictable markdown document
- content stays readable in both Notion and Obsidian workflows
