# Phase 1 — Finish Premium Polish

**Status**: ✅ Build Passing — All Tasks Implemented
**Started**: April 2026

---

## Tasks

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1 | Download as `.pine` button | ★★★★★ | ✅ Done |
| 2 | Validator badge in output header | ★★★★★ | ✅ Done |
| 3 | Structured Inputs + Improve My Prompt + `/api/improve-prompt` | ★★★★★ | ✅ Done |
| 4 | Move generation stats into output card header (reorder) | ★★★★ | ✅ Done |
| 5 | Strengthen streaming glass effect | ★★★ | ✅ Done |

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `lib/validation.ts` | Zod schemas: `generateSchema`, `improvePromptSchema` |
| `components/strategy/StructuredInputs.tsx` | Collapsible advanced options (Timeframe, Market, Direction, Indicators, R:R) |
| `app/api/improve-prompt/route.ts` | POST endpoint — rewrites user prompt using Grok |
| `.context/current-feature.md` | This file — tracks changes |

### Modified Files

| File | Changes |
|------|---------|
| `components/strategy/ScriptOutput.tsx` | Add `validateScript()` and `ValidationResult` export |
| `components/strategy/StrategyForm.tsx` | Reorder output header, add Download/Validator/Improve Prompt, wire StructuredInputs, pass structured inputs to generate API |
| `app/api/generate/route.ts` | Import `generateSchema` from `lib/validation.ts`, accept structured inputs, append context to prompt |
| `lib/constants.ts` | Add `DEFAULT_RR_RATIO` |
| `app/globals.css` | Add `border-glow` keyframe animation |

### Deleted Files

None.

---

## Detailed Changes

### 1. `lib/validation.ts` (NEW)

- `generateSchema`: Zod object with `prompt`, `balance`, `model`, `market`, `timeframe`, `direction`, `indicators`, `rr` — all optional except prompt/balance
- `improvePromptSchema`: Zod object with `prompt`, `market`, `timeframe`, `direction`, `indicators`, `rr` — prompt required, rest optional

### 2. `components/strategy/ScriptOutput.tsx`

- Add `ValidationResult` type: `{ hasVersion, hasDeclaration, hasAlert, bracketsMatch, isValid }`
- Add `validateScript(script: string): ValidationResult` — checks `//@version=5`, `indicator(|strategy(`, `alertcondition(|alert(`, bracket matching
- No changes to rendering — validation is computed in `StrategyForm` and displayed there

### 3. `components/strategy/StrategyForm.tsx`

- **Imports**: Add `Download`, `AlertTriangle`, `Sparkles` from lucide-react; add `validateScript`, `ValidationResult` from ScriptOutput; add `StructuredInputs`, `StructuredInputsValue`
- **New state**: `validationResult`, `structuredInputs`, `isImproving`
- **New useEffect**: Watch `[isGenerating, generatedScript]` — when stream ends, call `validateScript`
- **New `handleDownload`**: Blob + URL.createObjectURL, download as `strategy-{timestamp}.pine`, revoke URL, toast success
- **New `handleImprovePrompt`**: POST to `/api/improve-prompt`, replace textarea content with improved prompt, loading state
- **Output card header reorder**: `Output title | Validator badge | Streaming badge | Gen stats | [Stop] [Download] [Copy]`
- **Validator badge**: Green `Valid Pine Script v5 ✓` with `ShieldCheck` icon, or amber `Review needed` with `AlertTriangle`
- **Download button**: Label `Download .pine`; shown when `generatedScript && !isGenerating`, uses `handleDownload`
- **Generation stats**: Changed from `{genElapsed}s · ~{words} tokens` to `Generated in {genElapsed}s · ~{chars/4} tokens`
- **StructuredInputs**: Added after `<ModelSelector>`, passes `value` and `onChange`
- **Improve My Prompt button**: Added after Balance+Generate row, ghost button, disabled when no prompt
- **Generate body**: Spread `structuredInputs` into the JSON body

### 4. `components/strategy/StructuredInputs.tsx` (NEW)

- Collapsible panel toggled by "Advanced Options" button with `ChevronDown` icon
- **Timeframe**: `<select>` with `1m, 5m, 15m, 1h, 4h, 1D` + "Any" default
- **Market**: `<select>` with `Stocks, Crypto, Forex, Futures` + "Any"
- **Direction**: `<select>` with `Long only, Short only, Both` + "Any"
- **Indicators**: Multi-select chip buttons (`RSI, MACD, VWAP, EMA, Bollinger`) — active state matches PromptTemplates styling
- **R:R slider**: `<input type="range">` min=1 max=5 step=0.5, default from `DEFAULT_RR_RATIO`. Display `{value}:1`
- Exports `StructuredInputsValue` type with `market?`, `timeframe?`, `direction?`, `indicators?`, `rr?`

### 5. `app/api/improve-prompt/route.ts` (NEW)

- POST handler
- Validate body with `improvePromptSchema`
- Build context string from market/timeframe/direction/indicators/rr
- Call `generateText` with `grok-4-1-fast-non-reasoning` (fast model for prompt rewriting)
- System prompt: rewrite rough strategy description into detailed structured prompt for Pine Script v5
- Return `{ improvedPrompt: string }`
- Sanitized error messages (no raw LLM errors)

### 6. `app/api/generate/route.ts`

- Remove inline Zod schema, import `generateSchema` from `@/lib/validation`
- Destructure `market`, `timeframe`, `direction`, `indicators`, `rr` from parsed data
- Build context parts array from structured inputs
- Append context to prompt: `"Strategy description: ${strategy}\nAccount balance: ${balance}"` + optional context block
- Rest unchanged

### 7. `lib/constants.ts`

- Add `DEFAULT_RR_RATIO = 2`

### 8. `app/globals.css`

- Add `@keyframes border-glow` animation (pulsing green glow)
- Add `.animate-border-glow` utility class
- Apply to streaming output card via StrategyForm conditional class

---

## Completion Criteria

- [x] Download button appears after generation, downloads `.pine` file
- [x] Validator badge shows green/amber after stream ends
- [x] StructuredInputs collapsible panel works with all fields
- [x] "Improve My Prompt" button sends to API and replaces textarea
- [x] Generation stats show "Generated in Xs · ~Y tokens" format
- [x] Output card header order matches spec
- [x] Streaming glass effect has subtle animated glow
- [x] `npm run build` passes with no errors