/**
 * Spec 48 — Export Breakdown Source Contract.
 *
 * Single source of truth for what feeds the Notion / Obsidian export. This
 * file owns the **shape** only — formatting lives in spec 49
 * (`lib/export/strategy-markdown.ts`) and the user-facing actions live in
 * spec 50.
 *
 * Rules from the spec:
 * - do not require new AI calls for export
 * - do not require DB persistence for the export artifact itself
 * - exported content must be reproducible from existing state
 *
 * The builders below are pure and deterministic so spec 49 can rely on a
 * stable input regardless of where the data was assembled (active
 * generator output, a loaded history entry, etc.).
 */
import { GROK_MODELS } from '@/lib/config/constants';
import type { GrokModelId, SavedScript } from '@/lib/types';

/** Fallback title when the caller does not provide one. */
export const DEFAULT_EXPORT_TITLE = 'Untitled strategy';

/**
 * Canonical, human-readable model descriptor included in the export
 * payload. `id` is the persisted `GrokModelId`; `label` is the
 * display string from {@link GROK_MODELS} so spec 49 does not need to
 * re-resolve constants when rendering markdown.
 */
export type StrategyExportSourceModel = {
  id: GrokModelId;
  label: string;
};

/**
 * Structured generator inputs preserved verbatim from the active form
 * state or a saved entry. Every field is optional because legacy entries
 * and freshly-typed prompts may not populate all of them. Spec 49
 * decides which sections to render based on which fields are present.
 */
export type StrategyExportStructuredInputs = {
  market?: string;
  timeframe?: string;
  direction?: string;
  indicators?: string[];
  rr?: string;
  /**
   * Account balance is preserved verbatim (e.g. `"$10,000"`) so the
   * serializer can echo whatever the user originally entered without
   * re-parsing currency. Not in the spec's explicit "structured inputs"
   * list, but the spec marks the list as illustrative ("such as …").
   */
  balance?: string;
};

/**
 * Canonical export payload. Specs 49 (serializer) and 50 (UI) both
 * depend on this exact shape. Any future export target (PDF, share
 * link, etc.) should consume `StrategyExportSource` and add formatting
 * on top — never reach into generator state directly.
 */
export type StrategyExportSource = {
  /** Display title; defaults to {@link DEFAULT_EXPORT_TITLE} on empty input. */
  title: string;
  /** Original strategy prompt, trimmed. */
  prompt: string;
  /**
   * Generated Pine Script body. Preserved verbatim — internal
   * whitespace and trailing newlines are intentionally NOT normalized
   * here. Spec 49's serializer is in charge of fenced-code-block
   * formatting.
   */
  script: string;
  /** Resolved model meta, or `null` if the id is unknown / missing. */
  model: StrategyExportSourceModel | null;
  /** Structured form inputs preserved verbatim from the active state. */
  structuredInputs: StrategyExportStructuredInputs;
  /**
   * Breakdown markdown loaded lazily by the user in the Breakdown tab.
   * `null` when the user has not opened the tab yet — spec 50 is in
   * charge of either skipping the section or prompting the user to
   * load it before exporting.
   */
  breakdown: string | null;
  /** ISO timestamp from history / DB; `null` for freshly generated drafts. */
  createdAt: string | null;
  /**
   * ISO timestamp for the most recent edit. `null` when not surfaced by
   * the current `SavedScript` model — kept on the contract so spec 49
   * can opt in later without a breaking change.
   */
  updatedAt: string | null;
};

/** Generic input shape for {@link buildStrategyExportSource}. */
export type BuildStrategyExportSourceInput = {
  title?: string | null;
  prompt: string;
  script: string;
  model?: GrokModelId | null;
  structuredInputs?: StrategyExportStructuredInputs;
  breakdown?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function resolveModelMeta(id: GrokModelId): StrategyExportSourceModel | null {
  const model = GROK_MODELS.find((m) => m.id === id);
  if (!model) return null;
  return { id: model.id, label: model.label };
}

function pickStructuredInputs(
  raw: StrategyExportStructuredInputs,
): StrategyExportStructuredInputs {
  const out: StrategyExportStructuredInputs = {};
  const market = raw.market?.trim();
  if (market) out.market = market;
  const timeframe = raw.timeframe?.trim();
  if (timeframe) out.timeframe = timeframe;
  const direction = raw.direction?.trim();
  if (direction) out.direction = direction;
  if (raw.indicators && raw.indicators.length > 0) {
    const filtered = raw.indicators
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
    if (filtered.length > 0) out.indicators = filtered;
  }
  const rr = raw.rr?.trim();
  if (rr) out.rr = rr;
  const balance = raw.balance?.trim();
  if (balance) out.balance = balance;
  return out;
}

/**
 * Build a {@link StrategyExportSource} from raw generator inputs. Pure
 * and deterministic — same input always produces the same output. Safe
 * to call on the server or the client.
 *
 * Caller is responsible for providing a non-empty `script`; this helper
 * never throws and never normalizes script content (spec 49 owns
 * formatting).
 */
export function buildStrategyExportSource(
  input: BuildStrategyExportSourceInput,
): StrategyExportSource {
  const trimmedTitle = (input.title ?? '').trim();
  const trimmedBreakdown = (input.breakdown ?? '').trim();
  return {
    title: trimmedTitle || DEFAULT_EXPORT_TITLE,
    prompt: input.prompt.trim(),
    script: input.script,
    model: input.model ? resolveModelMeta(input.model) : null,
    structuredInputs: pickStructuredInputs(input.structuredInputs ?? {}),
    breakdown: trimmedBreakdown.length > 0 ? trimmedBreakdown : null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  };
}

/**
 * Convenience funnel for the history path: derive a
 * {@link StrategyExportSource} from a persisted {@link SavedScript}.
 * The optional `breakdown` argument is passed through verbatim so
 * spec 50 can attach lazily-loaded Breakdown content from the
 * explain-script panel without lifting state.
 *
 * `updatedAt` stays `null` here because the current `SavedScript` model
 * does not surface the column; if/when the row mapper exposes it,
 * callers can pass it explicitly via {@link buildStrategyExportSource}.
 */
export function buildExportSourceFromSavedScript(
  saved: SavedScript,
  options: { breakdown?: string | null } = {},
): StrategyExportSource {
  return buildStrategyExportSource({
    title: saved.name,
    prompt: saved.prompt,
    script: saved.script,
    model: saved.model ?? null,
    structuredInputs: {
      market: saved.market,
      timeframe: saved.timeframe,
      direction: saved.direction,
      indicators: saved.indicators,
      rr: saved.rr,
      balance: saved.balance,
    },
    breakdown: options.breakdown ?? null,
    createdAt: saved.createdAt,
    updatedAt: null,
  });
}
