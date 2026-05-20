# 08 — Terminal Polish

Add restrained CRT/phosphor style enhancements to the generator UI. This spec
owns visual texture polish only.

## Goal

Push PineForge's dark terminal identity a bit further without making the UI
harder to read.

## Scope

- subtle emerald glow on active elements
- light scanline/noise treatment where appropriate
- reuse of existing auth-shell texture patterns if that can be shared cleanly

## Files

- `app/globals.css`
- output/code surfaces in strategy components as needed
- optional shared UI helper if texture classes should be centralized

## Rules

- readability comes first
- reuse existing visual assets/patterns; do not copy-paste large styling blocks
- keep the effect subtle, not theatrical

## Check When Done

- Active elements feel more branded
- Texture effects stay subtle and readable
- Shared texture logic is centralized if extracted
