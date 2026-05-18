# 28 — Alert Message Templates Overview

Add **Alert Message Templates** to PineForge so users can generate ready-to-use
webhook JSON payloads for popular alert automation platforms alongside the Pine
Script output.

## Goal

After a script is generated or refined, the user can open an alert template tool
and get broker-ready JSON payloads they can paste into TradingView alert message
fields or webhook integrations.

This feature reduces the gap between "script is ready" and "alert automation is
configured."

## User Value

- Saves traders from manually writing fragile webhook JSON
- Makes PineForge useful beyond code generation alone
- Helps users move from TradingView signal to execution workflow faster

## Supported Providers (v1)

First version should support:

- **3Commas**
- **Alertatron**
- **WunderTrading**
- one generic **Custom Webhook JSON** template

Do not add more providers in this unit unless a context file explicitly asks for
them.

## Output Shape

Each generated provider template should include:

- **provider** — provider name
- **label** — short UI-friendly title
- **description** — one short line about when to use it
- **messageJson** — formatted JSON string the user can copy
- **notes** — 1 to 3 provider-specific usage notes
- **placeholders** — values the user must replace manually

The generated JSON should be:

- valid JSON
- easy to read
- clearly marked with placeholders for secrets, bot IDs, symbols, or account identifiers

## Product Rules

- This feature generates **templates only**
- PineForge does **not** send webhooks or store provider credentials
- PineForge does **not** guarantee provider-side correctness for every account setup
- Users must still review and replace placeholders before live use

## Trigger Rules

- Available only when a script exists
- Works after initial generation and after refinement
- Manual trigger only in this first version
- A new script or refinement should clear stale template results until the user regenerates them

## UX Principles

- Keep provider output compact and copy-ready
- Make the copy action obvious
- Make placeholders unmistakable
- Show small provider notes, not long tutorials
- Avoid mixing Pine Script code and broker JSON in the same panel

## Scope Limits

- No outbound webhook sending
- No provider credential storage
- No provider API validation calls
- No persistence in DB for v1
- No auto-generation immediately after script generation
- No provider-specific forms in this feature unit

## Dependencies

- Existing generated script context
- Existing AI route protection pattern
- Existing output tab or panel patterns on `/generate`

## Check When Done

- User can generate alert templates when a script exists
- Supported providers are limited to the approved v1 list
- Output is valid JSON with visible placeholders
- Stale template state clears when the script changes
- Feature is framed as template generation, not execution automation
