import type { TimeWindow } from '../../types';
import type {
  HeatLevel,
  Token,
  TokenChain,
  TokenChainFilter,
  TokenFetchOpts,
  TokenFilter,
} from '../../types/token';
import type { TokenProvider } from '../TokenProvider';
import { dexBoosts, dexMain } from './rateLimiter';

/**
 * Real DexScreener integration. No auth required. Public docs:
 *   https://docs.dexscreener.com/api/reference
 *
 * Strategy:
 *  1. Discovery — `/token-boosts/top/v1` + `/token-boosts/latest/v1` give us
 *     ~60 actively-promoted tokens across all chains. We treat this as our
 *     "universe" since DexScreener has no public top/trending endpoint.
 *  2. Enrichment — `/latest/dex/tokens/{addr1,addr2,...}` (up to 30 per call)
 *     returns full pair data for every address. A token can have multiple
 *     pairs across DEXes; we pick the one with the highest USD liquidity as
 *     canonical so price / fdv / change figures are stable.
 *  3. Sort / filter — filter / chain / window applied in memory on the
 *     enriched universe. Each provider instance memoises the universe for
 *     UNIVERSE_TTL_MS so back-to-back filter requests don't re-hit DexScreener.
 *
 * DexScreener does not publish a 7d price-change field; the 7d window
 * falls back to 24h until a real series source lands.
 */

const DEX_BASE = 'https://api.dexscreener.com';
const UA = 'metamap/1.0 (+https://metamap.dev)';
const UNIVERSE_TTL_MS = 60_000;
const TOKEN_BATCH_SIZE = 30;
const FETCH_TIMEOUT_MS = 8_000;

const CHAIN_MAP: Record<string, TokenChain> = {
  solana: 'solana',
  ethereum: 'ethereum',
  base: 'base',
  bsc: 'bsc',
};
function mapChain(raw: string): TokenChain {
  return CHAIN_MAP[raw] ?? 'other';
}

type DexBoost = {
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  totalAmount?: number;
  amount?: number;
};

type DexPair = {
  chainId: string;
  dexId: string;
  url?: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative?: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys?: number; sells?: number };
    h1?: { buys?: number; sells?: number };
    h6?: { buys?: number; sells?: number };
    h24?: { buys?: number; sells?: number };
  };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: { imageUrl?: string };
};

type DexTokensResponse = {
  schemaVersion?: string;
  pairs?: DexPair[] | null;
};

class DexscreenerError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    message: string
  ) {
    super(`DexScreener ${endpoint} → ${status}: ${message}`);
  }
}

async function call<T>(
  bucket: typeof dexMain,
  path: string
): Promise<T> {
  await bucket.acquire();
  const url = `${DEX_BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new DexscreenerError(path, res.status, body.slice(0, 200));
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Deduplicate `[chain, addr]` pairs preserving boost order. */
function dedupeAddresses(boosts: DexBoost[]): { chain: string; addr: string }[] {
  const seen = new Set<string>();
  const out: { chain: string; addr: string }[] = [];
  for (const b of boosts) {
    if (!b.tokenAddress) continue;
    const key = `${b.chainId}:${b.tokenAddress.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ chain: b.chainId, addr: b.tokenAddress });
  }
  return out;
}

/**
 * Group pairs by base-token (chain + address). A token can have many pairs;
 * we pick the one with the highest USD liquidity as canonical.
 */
function pickCanonicalPairs(pairs: DexPair[]): DexPair[] {
  const byToken = new Map<string, DexPair>();
  for (const p of pairs) {
    if (!p.baseToken?.address) continue;
    const key = `${p.chainId}:${p.baseToken.address.toLowerCase()}`;
    const existing = byToken.get(key);
    const liq = p.liquidity?.usd ?? 0;
    if (!existing || (existing.liquidity?.usd ?? 0) < liq) {
      byToken.set(key, p);
    }
  }
  return Array.from(byToken.values());
}

function categoriseHeat(priceChange24h: number, momentum: number): HeatLevel {
  if (priceChange24h > 200 || momentum > 0.7) return 'hot';
  if (priceChange24h > 30 || momentum > 0.3) return 'warm';
  return 'emerging';
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Convert a DexScreener pair into our Token shape. */
export function pairToToken(p: DexPair): Token {
  const chain = mapChain(p.chainId);
  const priceUsd = Number(p.priceUsd ?? 0) || 0;
  const priceChange24h = p.priceChange?.h24 ?? 0;
  const priceChange1h = p.priceChange?.h1 ?? 0;
  const volume24h = p.volume?.h24 ?? 0;
  const liquidityUsd = p.liquidity?.usd ?? 0;
  const marketCap = p.marketCap ?? p.fdv ?? 0;
  const fdv = p.fdv;

  // Momentum: blend 1h + 24h percent change, soft-clipped into [-1, 1].
  // 24h drives the magnitude, 1h is a tie-breaker for "still pumping".
  const momentum = clamp(
    (priceChange24h / 100) * 0.7 + (priceChange1h / 50) * 0.3,
    -1,
    1
  );

  const ageHours = p.pairCreatedAt
    ? Math.max(0, (Date.now() - p.pairCreatedAt) / 3_600_000)
    : 0;

  return {
    id: `dex-${p.chainId}-${(p.baseToken.address || p.pairAddress).toLowerCase()}`,
    symbol: p.baseToken.symbol || '???',
    name: p.baseToken.name || p.baseToken.symbol || 'Unknown',
    marketCap,
    volume24h,
    priceUsd,
    priceChange24h,
    momentum,
    category: categoriseHeat(priceChange24h, momentum),
    narrativeTags: [], // DexScreener doesn't tag — narrative tags come later
    chain,
    age: ageHours,
    contractAddress: p.baseToken.address,
    source: 'dexscreener',
    fdv,
    liquidityUsd,
    priceChange5m: p.priceChange?.m5,
    priceChange1h,
    priceChange6h: p.priceChange?.h6,
    buys24h: p.txns?.h24?.buys,
    sells24h: p.txns?.h24?.sells,
    buys1h: p.txns?.h1?.buys,
    sells1h: p.txns?.h1?.sells,
    pairAddress: p.pairAddress,
    dexId: p.dexId,
    pairUrl: p.url,
    imageUrl: p.info?.imageUrl,
  };
}

/** Compute the activity score the moon uses for crater sizing — duplicated
 *  here (instead of importing `lib/tokenActivity`) so this module stays a
 *  leaf node with no dependency on UI code. Identical formula. */
function activityScore(t: Token): number {
  const momentumScore = Math.max(0, Math.min(1, t.momentum));
  const volumeScore = Math.min(
    1,
    Math.log10(Math.max(1000, t.volume24h)) / 10
  );
  const recencyScore = Math.max(0, 1 - t.age / 24);
  return momentumScore * 0.4 + volumeScore * 0.4 + recencyScore * 0.2;
}

function applyChain(tokens: Token[], chain: TokenChainFilter): Token[] {
  if (chain === 'all') return tokens;
  return tokens.filter((t) => t.chain === chain);
}

/** Pick the price-change field for the requested window. DexScreener has
 *  no 7d field — falls back to 24h. */
function changeForWindow(t: Token, window: TimeWindow): number {
  if (window === '1h') return t.priceChange1h ?? t.priceChange24h;
  return t.priceChange24h;
}

/**
 * Apply the API filter on top of the chain-filtered universe.
 *
 *   trending — by activity score desc (volume + momentum + recency)
 *   gainers  — by window price-change desc
 *   losers   — by window price-change asc
 *   new      — by age asc (newest first), excluding launches with no
 *              pairCreatedAt timestamp
 */
export function applyFilter(
  tokens: Token[],
  filter: TokenFilter,
  window: TimeWindow,
  limit: number
): Token[] {
  let working = tokens.slice();
  switch (filter) {
    case 'trending':
      working.sort((a, b) => activityScore(b) - activityScore(a));
      break;
    case 'gainers':
      working.sort(
        (a, b) => changeForWindow(b, window) - changeForWindow(a, window)
      );
      break;
    case 'losers':
      working.sort(
        (a, b) => changeForWindow(a, window) - changeForWindow(b, window)
      );
      break;
    case 'new':
      working = working.filter((t) => t.age > 0);
      working.sort((a, b) => a.age - b.age);
      break;
  }
  return working.slice(0, limit);
}

export class DexscreenerTokenProvider implements TokenProvider {
  readonly id = 'dexscreener' as const;

  /** Memoised enriched universe — populated by ensureUniverse(). */
  private universe: Token[] | null = null;
  private universeAt = 0;

  /**
   * Default `fetch` for the TokenProvider interface. Delegates to the
   * per-filter helpers so calling `provider.fetch({ window, filter: 'gainers' })`
   * is equivalent to `provider.getGainers(window)`.
   */
  async fetch(opts: TokenFetchOpts): Promise<Token[]> {
    const filter = opts.filter ?? 'trending';
    const chain = opts.chain ?? 'all';
    const limit = Math.min(opts.limit ?? 100, 200);
    const universe = await this.ensureUniverse();
    const chainScoped = applyChain(universe, chain);
    return applyFilter(chainScoped, filter, opts.window, limit);
  }

  // ── Public typed helpers ──

  async getTrending(
    window: TimeWindow,
    chain: TokenChainFilter = 'all',
    limit = 100
  ): Promise<Token[]> {
    return this.fetch({ window, filter: 'trending', chain, limit });
  }

  async getGainers(
    window: TimeWindow,
    chain: TokenChainFilter = 'all',
    limit = 100
  ): Promise<Token[]> {
    return this.fetch({ window, filter: 'gainers', chain, limit });
  }

  async getLosers(
    window: TimeWindow,
    chain: TokenChainFilter = 'all',
    limit = 100
  ): Promise<Token[]> {
    return this.fetch({ window, filter: 'losers', chain, limit });
  }

  async getNewPairs(
    chain: TokenChainFilter = 'all',
    limit = 100
  ): Promise<Token[]> {
    return this.fetch({ window: '1h', filter: 'new', chain, limit });
  }

  /** Single-token lookup. Returns the canonical pair (max-liquidity DEX). */
  async getByAddress(addr: string): Promise<Token | null> {
    const res = await call<DexTokensResponse>(
      dexMain,
      `/latest/dex/tokens/${encodeURIComponent(addr)}`
    );
    const pairs = pickCanonicalPairs(res.pairs ?? []);
    const match = pairs.find(
      (p) => p.baseToken.address.toLowerCase() === addr.toLowerCase()
    );
    return match ? pairToToken(match) : null;
  }

  /** Free-text search. Returns up to `limit` canonical Tokens, sorted by
   *  liquidity desc. */
  async searchTokens(query: string, limit = 20): Promise<Token[]> {
    if (!query.trim()) return [];
    const res = await call<DexTokensResponse>(
      dexMain,
      `/latest/dex/search?q=${encodeURIComponent(query)}`
    );
    return pickCanonicalPairs(res.pairs ?? [])
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
      .slice(0, limit)
      .map(pairToToken);
  }

  /** Force the next fetch to re-hit DexScreener. Used by the cron warmer. */
  invalidateUniverse(): void {
    this.universe = null;
    this.universeAt = 0;
  }

  // ── Internals ──

  private async ensureUniverse(): Promise<Token[]> {
    const fresh = Date.now() - this.universeAt < UNIVERSE_TTL_MS;
    if (this.universe && fresh) return this.universe;

    const boosts = await this.fetchBoostUniverse();
    if (boosts.length === 0) {
      this.universe = [];
      this.universeAt = Date.now();
      return this.universe;
    }

    const pairs = await this.fetchPairsForBoosts(boosts);
    const canonical = pickCanonicalPairs(pairs);
    const tokens = canonical
      .map(pairToToken)
      // Drop ghost tokens with no symbol — boost endpoints occasionally
      // include addresses whose pair has since rugged or delisted.
      .filter((t) => t.symbol && t.symbol !== '???');

    this.universe = tokens;
    this.universeAt = Date.now();
    return tokens;
  }

  private async fetchBoostUniverse(): Promise<DexBoost[]> {
    const [top, latest] = await Promise.allSettled([
      call<DexBoost[]>(dexBoosts, '/token-boosts/top/v1'),
      call<DexBoost[]>(dexBoosts, '/token-boosts/latest/v1'),
    ]);
    const merged: DexBoost[] = [];
    if (top.status === 'fulfilled') merged.push(...top.value);
    else console.warn('[dex] boosts/top failed:', top.reason?.message);
    if (latest.status === 'fulfilled') merged.push(...latest.value);
    else console.warn('[dex] boosts/latest failed:', latest.reason?.message);
    return merged;
  }

  private async fetchPairsForBoosts(boosts: DexBoost[]): Promise<DexPair[]> {
    // DexScreener's /tokens batch endpoint accepts comma-separated addresses
    // but doesn't honour chainId, so we feed it the raw address list and
    // let the response carry chainId per-pair. Filter to canonical chains
    // on the way back.
    const addrs = Array.from(
      new Set(dedupeAddresses(boosts).map((b) => b.addr))
    );

    const batches: string[][] = [];
    for (let i = 0; i < addrs.length; i += TOKEN_BATCH_SIZE) {
      batches.push(addrs.slice(i, i + TOKEN_BATCH_SIZE));
    }

    const results = await Promise.allSettled(
      batches.map((batch) =>
        call<DexTokensResponse>(
          dexMain,
          `/latest/dex/tokens/${batch.join(',')}`
        )
      )
    );

    const pairs: DexPair[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        pairs.push(...(r.value.pairs ?? []));
      } else {
        console.warn('[dex] tokens batch failed:', r.reason?.message);
      }
    }
    return pairs;
  }
}

export { DexscreenerError };
