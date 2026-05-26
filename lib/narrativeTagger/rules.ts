import { hashString } from '../tokenActivity';
import type { Narrative, NarrativeTag } from '../types';
import type { Token } from '../types/token';

/**
 * Stage A — rules-based narrative→token matcher.
 *
 * Each Narrative carries a `keywords: string[]` list. A token matches a
 * narrative when at least one keyword appears in the token's symbol or
 * name. The matcher is intentionally cheap and deterministic — both
 * properties matter for cache stability and unit tests.
 *
 * Matching strategy:
 *   NAME field   — word-boundary, case-insensitive. "Memecoin Summer"
 *                  matches `memecoin`; "Method" does NOT match `eth`.
 *   SYMBOL field — substring (no word boundary) so compound tickers
 *                  like TRIPEPE / BASEDPEPE / AIDOGE pick up their
 *                  parent narrative. Symbols are short, all-caps, and
 *                  rarely contain incidental substrings — false-
 *                  positive risk stays low.
 *
 * Keywords shorter than MIN_SUBSTRING_LEN fall back to word-boundary
 * everywhere — "ai" / "us" / "cn" matched as substrings would over-tag
 * heavily.
 *
 * Stage B (TODO: LLM matcher in v2) will swap this for an embedding-
 * based similarity pass against tweet bodies + token descriptions. The
 * interface below stays the same so callers don't have to branch.
 */

const MIN_SUBSTRING_LEN = 4;

/** Pre-compiled keyword index — built once per narrative set, reused
 *  across every token in the batch. */
type KeywordIndex = {
  narrative: Narrative;
  /** Lowercased keyword + flag whether substring matching is allowed
   *  on the symbol field. Short keywords stay word-bounded. */
  keywords: { needle: string; pattern: RegExp; allowSubstring: boolean }[];
};

const WORD_BOUNDARY = '\\b';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildKeywordIndex(narratives: Narrative[]): KeywordIndex[] {
  return narratives.map((n) => ({
    narrative: n,
    keywords: (n.keywords ?? [])
      .filter((k) => k && k.trim().length > 0)
      .map((raw) => {
        const needle = raw.toLowerCase();
        return {
          needle,
          pattern: new RegExp(
            `${WORD_BOUNDARY}${escapeRegex(needle)}${WORD_BOUNDARY}`,
            'i'
          ),
          allowSubstring: needle.length >= MIN_SUBSTRING_LEN,
        };
      }),
  }));
}

/** Build a NarrativeTag from a narrative. The colorHash is the only
 *  derived field — everything else comes from the narrative's own
 *  metadata. */
export function narrativeToTag(n: Narrative): NarrativeTag {
  return {
    id: n.id,
    label: n.tagLabel || n.title.slice(0, 40),
    countryISO: n.country,
    themes: n.themes ?? [],
    colorHash: hashString(n.id) % 10,
  };
}

function matches(token: Token, idx: KeywordIndex): boolean {
  const symbol = token.symbol.toLowerCase();
  // Wrap name in spaces so the regex's leading word-boundary works at
  // both ends without per-keyword anchors.
  const name = ` ${token.name.toLowerCase()} `;
  for (const k of idx.keywords) {
    // Word-boundary check covers the name (and the symbol when it's a
    // standalone ticker).
    if (k.pattern.test(symbol) || k.pattern.test(name)) return true;
    // Substring fallback on the symbol only — catches compound tickers
    // (TRIPEPE → pepe, BASEDPEPE → pepe, AIDOG → dog).
    if (k.allowSubstring && symbol.includes(k.needle)) return true;
  }
  return false;
}

/** Return the set of narrative tags that match a single token. Order
 *  follows the order of `narratives` so output is stable when callers
 *  pass a ranked list. */
export function tagToken(
  token: Token,
  narratives: Narrative[]
): NarrativeTag[] {
  const index = buildKeywordIndex(narratives);
  return index.filter((i) => matches(token, i)).map((i) => narrativeToTag(i.narrative));
}

/** Tag a batch of tokens against a narrative set. Returns new Token
 *  objects with populated `narrativeTags`; inputs are not mutated.
 *  More efficient than calling tagToken() in a loop — the keyword
 *  index is built once. */
export function tagTokens(
  tokens: Token[],
  narratives: Narrative[]
): Token[] {
  const index = buildKeywordIndex(narratives);
  return tokens.map((t) => ({
    ...t,
    narrativeTags: index
      .filter((i) => matches(t, i))
      .map((i) => narrativeToTag(i.narrative)),
  }));
}

/** Inverse link — given the already-tagged tokens, populate each
 *  narrative's relatedTokenIds. Pure / deterministic / stable order. */
export function inverseLink(
  narratives: Narrative[],
  taggedTokens: Token[]
): Narrative[] {
  const byNarrative = new Map<string, string[]>();
  for (const t of taggedTokens) {
    for (const tag of t.narrativeTags) {
      const arr = byNarrative.get(tag.id) ?? [];
      arr.push(t.id);
      byNarrative.set(tag.id, arr);
    }
  }
  return narratives.map((n) => ({
    ...n,
    relatedTokenIds: byNarrative.get(n.id) ?? [],
  }));
}

// TODO: LLM matcher in v2.
// export async function tagTokenLLM(
//   token: Token,
//   narratives: Narrative[],
//   opts?: { model?: string; signal?: AbortSignal }
// ): Promise<NarrativeTag[]>;
//
// Sketch: embed (symbol + name + recent tweet bodies for matched cashtags)
// and (narrative.title + summary + top tweets). Cosine-similarity rank,
// threshold at ~0.78, return narrativeToTag(n) for each hit. Gated by
// LLM_MATCHER=true so the rules path stays the default in CI/preview.
