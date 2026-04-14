# Phase 2 — Daily Driver Features

**Status**: Phase 2 shipped — Script History, Refine Chat, Multi-tab output, and TradingView Webhook JSON export  
**Updated**: April 2026 (post-audit fixes applied)

Companion roadmap: [.documents/PRD_.md](../.documents/PRD_.md) (Phase 2 table), [.documents/TECHNICAL_.md](../.documents/TECHNICAL_.md).

---

## Post-audit fixes completed

The following audit fixes are now implemented:

- Security headers + baseline CSP in `next.config.ts` (`SEC-001`).
- Sanitized `try/catch` in `app/api/generate/route.ts` (`SEC-002`).
- `StrategyForm` refactor into smaller modules (`QUAL-001`):
  - `hooks/useScriptGeneration.ts`
  - `hooks/usePromptImprover.ts`
  - `components/strategy/StrategyInputsCard.tsx`
  - `components/strategy/StrategyOutputCard.tsx`
- Abort elapsed timing corrected with local `startTime` (`BUG-001`).
- Explain tab cache key switched to script fingerprint (`QUAL-002`).
- `TECHNICAL_.md` explain max length aligned to 20k (`DOCS-001`).
- `PRD_.md` Phase 2 table updated to done for multi-tab + webhook (`DOCS-002`).
- Improve-prompt now uses `DEFAULT_MODEL` (`QUAL-003`).
- `useScriptHistory` now validates parsed localStorage via Zod (`QUAL-004`).
- Added route-level `app/generate/error.tsx` (`QUAL-005`).
- Added constrained `rr` schema in `lib/validation.ts` (`QUAL-006`).

Remaining deferred item:

- `SEC-003` rate limiting on AI routes (planned later; intentionally not included in this pass).

---

## Tasks (PRD)

| Task | Priority | Status |
|------|----------|--------|
| Script History (localStorage + Sheet drawer) | ★★★★★ | ✅ Done |
| Refine Chat (conversational iteration) | ★★★★★ | ✅ Done |
| Multi-tab output (Script + Breakdown + Checklist) | ★★★★ | ✅ Done |
| TradingView Webhook JSON export | ★★★★ | ✅ Done |

---

## Done — Script History

### Behaviour

- Persisted under `localStorage` key `grokts:history`; max **50** entries ([`MAX_HISTORY_ENTRIES`](../lib/constants.ts)), **FIFO** (newest first, drop oldest when over limit).
- All reads/writes wrapped in `try/catch` per PRD.
- **Auto-save** after a generation **completes** with non-empty script (implemented in `StrategyForm` `finally` using an accumulated stream string). **No** save when the user **aborts** (`AbortError`).
- **Sheet** from the **left**; **History** trigger with **clock** icon in the `/generate` header row.
- Each entry: name (rename inline + Rename action), date, prompt preview (~60 chars), version badge (`v1` for initial saves; `v2+` with `parentId` from Refine Chat).
- Actions: **Load** (restores prompt, balance, model, structured inputs, script), **Rename**, **Delete**.
- Empty state: “No saved scripts yet. Generate your first one.”

### Technical notes

- [`hooks/useScriptHistory.ts`](../hooks/useScriptHistory.ts): `useSyncExternalStore` + `storage` + custom `grokts:history-mutated` for same-tab updates. **Stable snapshots**: module-level `EMPTY_SNAPSHOT` and serialized-string cache so `getServerSnapshot` / `readHistory` do not return new array references every call (fixes infinite re-render and React “cache getServerSnapshot” warnings).
- [`lib/types.ts`](../lib/types.ts): `SavedScript`, `GenerationStats`; saved payloads include model + structured fields for full restore.
- [`buildSavedScriptFromGeneration`](../hooks/useScriptHistory.ts): `crypto.randomUUID()`, ISO `createdAt`, name from first 40 chars of prompt.

---

## Done — Refine Chat

### Behaviour

- Panel **“Refine this script with Grok”** under the output **code** area (above the separator + three chips). Shown when there is script output or a refine is in progress; hidden during **Generate** streaming.
- **POST `/api/refine-script`**: stateless body `script` + `instruction` + optional `model` (defaults server-side). Streams full Pine replacement; **`maxOutputTokens`**: [`REFINE_MAX_OUTPUT_TOKENS`](../lib/constants.ts) (2000).
- Shared system instructions: [`lib/prompts/pine-generate-system.ts`](../lib/prompts/pine-generate-system.ts) (`PINE_GENERATE_SYSTEM_PROMPT`) — same rules as [`/api/generate`](../app/api/generate/route.ts).
- **Stop** aborts generate or refine (shared `AbortController`).
- **History**: each successful refine calls [`buildSavedScriptFromRefinement`](../hooks/useScriptHistory.ts) with `parentId` = root save id, `version` = `lastVersion + 1`. **Lineage** tracked in `StrategyForm` via `lineageRef` + `historyLineageReady` (reset when a new **Generate** starts; set on successful generate save or **Load** from History).

### Files

| File | Purpose |
|------|---------|
| `lib/prompts/pine-generate-system.ts` | Shared Pine v5 system prompt for generate + refine |
| `app/api/refine-script/route.ts` | Zod + `streamText` refine endpoint |
| `components/strategy/RefineChat.tsx` | Refine UI (textarea, Apply refinement, busy/disabled) |
| `hooks/useScriptHistory.ts` | `buildSavedScriptFromRefinement` |

### Modified

| File | Changes |
|------|---------|
| `lib/validation.ts` | `refineScriptSchema` |
| `lib/constants.ts` | `REFINE_MAX_OUTPUT_TOKENS` |
| `app/api/generate/route.ts` | Imports shared `PINE_GENERATE_SYSTEM_PROMPT` |
| `components/strategy/StrategyForm.tsx` | Refine stream, lineage, `RefineChat` placement |

---

## Done — Multi-tab output (Script / Breakdown / Checklist)

### Behaviour

- **Output card `CardHeader`**: stats, validator, Streaming badge, Stop, description; when the script is idle, **Download .pine**, **Webhook JSON** (toggle panel), and **Copy**.
- **Only the output card body** (bordered region with `outputRef`) wraps content in shadcn **`Tabs`**: values `script` | `breakdown` | `checklist`, labels **Script**, **Breakdown**, **Checklist**.
- **Script** tab: same [`ScriptOutput`](../components/strategy/ScriptOutput.tsx) as before — same props (`isGenerating={isOutputBusy}`, streaming + post-stream shiki). `TabsContent` uses **`forceMount`** + `data-[state=inactive]:hidden` so the script panel stays mounted during streaming and `outputRef` → `querySelector('pre')` scroll still works.
- **Breakdown**: plain-English explanation of the Pine script via **`POST /api/explain-script`** with `mode: 'breakdown'`.
- **Checklist**: numbered TradingView setup + three-alert instructions via same route with `mode: 'checklist'`.
- **Controlled tabs**: `outputTab` state + `onValueChange`. Resets to **`script`** when a **generation** starts, a **refinement** starts, or **`loadSavedScript`** runs; **`explainCancelKey`** increments on those events to **abort** in-flight explain streams and clear “started” flags in panels.
- **Lazy load**: Breakdown and Checklist call the API only on **first activation** of that tab for the **current** script text. **Per-script cache** (in-memory `Map` per panel) avoids repeat requests when switching tabs.
- **Loading / error**: skeleton + spinner while streaming response; toast + **Retry** on failure (retry bumps `retryTick` to re-run the effect).

### Technical notes

- [`explainScriptSchema`](../lib/validation.ts): `script` (10–20k chars) + `mode` enum.
- [`EXPLAIN_MAX_OUTPUT_TOKENS`](../lib/constants.ts) = **1800** for explain streams.
- Mode-specific system prompts: [`lib/prompts/explain-script.ts`](../lib/prompts/explain-script.ts) (`EXPLAIN_BREAKDOWN_SYSTEM`, `EXPLAIN_CHECKLIST_SYSTEM`). Route uses **`DEFAULT_MODEL`** only (no client-supplied model).
- Response: `streamText` → `toTextStreamResponse()` (aligned with generate/refine). Errors: 400 Zod issues, 500 sanitized JSON.

### Files

| File | Purpose |
|------|---------|
| `app/api/explain-script/route.ts` | Explain endpoint |
| `lib/prompts/explain-script.ts` | Breakdown + checklist system prompts |
| `components/strategy/ExplainScriptPanel.tsx` | Lazy fetch, cache, abort, streaming UI |
| `components/ui/tabs.tsx` | shadcn Tabs (Radix) |

### Modified

| File | Changes |
|------|---------|
| `lib/validation.ts` | `explainScriptSchema` |
| `lib/constants.ts` | `EXPLAIN_MAX_OUTPUT_TOKENS` |
| `components/strategy/StrategyForm.tsx` | `outputTab`, `explainCancelKey`, Tabs wrapper in output body; Webhook JSON in header + panel |

---

## Done — TradingView Webhook JSON export

### Behaviour

- **Webhook JSON** button in the output **card header** (between **Download .pine** and **Copy**), visible when `generatedScript` is present and output is not busy (same gating as the other actions). Toggles an inline panel under the header description.
- Panel: **Webhook URL** input (`type="url"`), **pretty-printed JSON** preview (`JSON.stringify(..., null, 2)`), **Copy JSON** (clipboard + sonner — same UX as script copy).
- **Client-side only**: [`buildWebhookJsonExport`](../lib/build-webhook-export.ts) builds the payload; **no API route** and the webhook URL is **never** sent to the server.
- **Auto-close**: `useEffect` closes the panel when **`isGenerating`** or **`isRefining`** becomes true (new generate or refine stream starts).
- **Payload shape**: `meta` (`generatedBy: GrokTS`, `pineVersion: v5`), `alertMessages` from [`PINE_WEBHOOK_ALERT_MESSAGES`](../lib/constants.ts), `tradingView.messageFieldTemplate` (`{{ticker}} {{interval}} {{message}}`), `sampleHttpRequest` with `POST`, JSON headers, body placeholders + first alert as `message`. `sampleHttpRequest.url` = trimmed user URL if non-empty, else `https://your-webhook-url.com`.

### Files

| File | Purpose |
|------|---------|
| [`lib/constants.ts`](../lib/constants.ts) | `PINE_WEBHOOK_ALERT_MESSAGES` (three strings; align with Pine system prompt) |
| [`lib/build-webhook-export.ts`](../lib/build-webhook-export.ts) | `WebhookJsonExport` type + `buildWebhookJsonExport` |
| [`components/strategy/WebhookJsonPanel.tsx`](../components/strategy/WebhookJsonPanel.tsx) | URL input, `<pre>` preview, Copy JSON |
| [`components/strategy/StrategyForm.tsx`](../components/strategy/StrategyForm.tsx) | Button, `webhookPanelOpen` / `webhookUrl`, panel mount, close-on-generate/refine |

---

## Verification checklist

### Script History

- [x] `npm run build` passes
- [ ] Manual: generate → History lists entry → Load restores form + output → Rename/Delete persist after refresh → 51st generation evicts oldest

### Refine Chat

- [ ] Manual: generate → refine twice → History shows v2/v3 with same `parentId` → Load v2 → refine → new row → Stop mid-refine → no duplicate save

### Multi-tab output

- [x] `npm run build` passes
- [ ] Manual: generate on **Script** tab → shiki after stream → open **Breakdown** / **Checklist** once each → streams fill → switch tabs without duplicate API calls → new generate or refine → tab returns to **Script** and explain refetches for new script → Load from History resets to **Script**

### Webhook JSON export

- [x] `npm run build` passes
- [ ] Manual: open **Webhook JSON** → preview matches spec (placeholders + three `alertMessages`) → enter URL → preview + copied JSON use that URL in `sampleHttpRequest.url` → clear URL → placeholder URL returns → start **Generate** or **Refine** with panel open → panel closes

### Audit fix pass

- [x] `npm run build` passes after post-audit refactor/security updates
- [x] Lint passes for touched refactor files (`StrategyForm`, inputs/output cards, new hooks)
