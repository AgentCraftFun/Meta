import type { NarrativeTag, TimeWindow } from '../types';

export type HeatLevel = 'hot' | 'warm' | 'emerging';

export type TokenChain = 'solana' | 'ethereum' | 'base' | 'other';

export type TokenSource = 'pumpfun' | 'dexscreener' | 'birdeye' | 'mock';

export type Token = {
  /** Canonical id, stable across refetches. */
  id: string;
  symbol: string;
  name: string;
  /** USD market cap. */
  marketCap: number;
  /** USD volume in the active window. */
  volume24h: number;
  priceUsd: number;
  /** -100 .. +∞ percent. */
  priceChange24h: number;
  /** -1 .. 1, derived from priceChange + volume velocity. */
  momentum: number;
  category: HeatLevel;
  /** Narratives this token matched against the current 1h news window.
   *  Empty array means "untagged" — not an error condition. Populated
   *  server-side by the narrativeTagger before the cache write. */
  narrativeTags: NarrativeTag[];
  chain: TokenChain;
  /** Hours since launch. */
  age: number;
  contractAddress?: string;
  source: TokenSource;

  // ── Optional DexScreener-derived fields (Phase G+). All optional so
  // mock and earlier providers keep type-checking. UI surfaces these
  // in the next sprint; for now they ride along in the API payload.

  /** Fully diluted valuation, USD. Differs from marketCap when supply is
   *  partly locked or unminted. */
  fdv?: number;
  /** Total locked liquidity for the canonical (highest-USD) pair, USD. */
  liquidityUsd?: number;
  priceChange5m?: number;
  priceChange1h?: number;
  priceChange6h?: number;
  /** Buy / sell counts in the named window. */
  buys24h?: number;
  sells24h?: number;
  buys1h?: number;
  sells1h?: number;
  /** Canonical pair (selected by max liquidity). */
  pairAddress?: string;
  /** DEX id, e.g. 'raydium', 'uniswap', 'aerodrome'. */
  dexId?: string;
  /** Direct link to the pair on DexScreener. */
  pairUrl?: string;
  /** CDN image URL when DexScreener has one for the token. */
  imageUrl?: string;
};

export type TokenSourceMode = 'mock' | 'dexscreener' | 'birdeye';

/** API-level filter set. Mirrors the moon HUD pills but also accessible
 *  via /api/tokens?filter=... for SSR / external consumers. */
export type TokenFilter = 'trending' | 'gainers' | 'losers' | 'new';

export type TokenChainFilter = 'all' | 'solana' | 'ethereum' | 'base';

export type TokenFetchOpts = {
  window: TimeWindow;
  /** Defaults to 'trending'. */
  filter?: TokenFilter;
  /** Defaults to 'all'. */
  chain?: TokenChainFilter;
  /** Max rows returned. Default 100, hard cap 200. */
  limit?: number;
};

export type TokenQuery = TokenFetchOpts;

export type TokensResponse = {
  source: TokenSourceMode;
  window: TimeWindow;
  filter: TokenFilter;
  chain: TokenChainFilter;
  cached: boolean;
  tokens: Token[];
};
