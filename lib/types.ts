export type TimeWindow = '1h' | '24h' | '7d';

export type NarrativeCategory = 'breaking' | 'trending' | 'emerging';

export type NarrativeSource = {
  url: string;
  author: string;
  text: string;
};

/**
 * Compact projection of a Narrative attached to a Token. The pair
 * (Token.narrativeTags <-> Narrative.relatedTokenIds) is the link layer
 * that makes "narratives drive tokens" measurable. NarrativeTag carries
 * just enough metadata to render a pill without re-joining to the full
 * Narrative — id pairs them up when the UI does need the full record.
 *
 *   id          — same as the narrative's id (stable, kebab-case)
 *   label       — human-readable pill text
 *   countryISO  — primary country, when the narrative is geo-tied
 *   themes      — coarse categories ("politics", "memes", ...)
 *   colorHash   — 0–9, deterministic from id; drives the pill palette
 */
export type NarrativeTag = {
  id: string;
  label: string;
  countryISO?: string;
  themes: string[];
  colorHash: number;
};

export type Narrative = {
  id: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  title: string;
  summary: string;
  /** 0–100 normalised volume */
  volume: number;
  /** -1 to 1 */
  sentiment: number;
  /** -1 to 1 */
  momentum: number;
  rank: number;
  category: NarrativeCategory;
  sources: NarrativeSource[];
  firstSeen: string;
  lastUpdated: string;
  timeWindow: TimeWindow;

  // ── Link layer (Phase G — narratives ↔ tokens). All required so the
  // tagger has a stable schema across providers; X-derived narratives
  // populate these from the cluster, mock narratives from hand-curated
  // seed data.

  /** Lowercase tokens used by the rules-based tagger. Match is word-
   *  boundary, case-insensitive over a token's symbol + name. */
  keywords: string[];
  /** Coarse theme tags propagated to NarrativeTag.themes. */
  themes: string[];
  /** Short pill label, e.g. "ETH ETF", "Trump-meta". */
  tagLabel: string;
  /** Token.id values whose symbol/name matched this narrative's
   *  keywords. Populated server-side after a fetch. */
  relatedTokenIds: string[];
};

export type SourceMode = 'mock' | 'x';

export type NarrativeQuery = {
  window: TimeWindow;
};
