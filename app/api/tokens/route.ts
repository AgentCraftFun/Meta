import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { linkAll } from '@/lib/narrativeTagger';
import { getActiveSourceMode, getProvider } from '@/lib/providers';
import {
  getActiveTokenSource,
  getTokenProvider,
} from '@/lib/providers/tokenProviders';
import type { Narrative, TimeWindow } from '@/lib/types';
import type {
  Token,
  TokenChainFilter,
  TokenFilter,
} from '@/lib/types/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cache TTL per window. Linked universe lives at
 *   linked:tokens:<tokenSource>:<narrativeSource>:<window>
 * and we slice it on serve. Filter + chain + limit don't touch upstream.
 */
const WINDOW_TTL_SECONDS: Record<TimeWindow, number> = {
  '1h': 5 * 60,
  '24h': 15 * 60,
  '7d': 60 * 60,
};

const VALID_WINDOWS: readonly TimeWindow[] = ['1h', '24h', '7d'];
const VALID_FILTERS: readonly TokenFilter[] = [
  'trending',
  'gainers',
  'losers',
  'new',
];
const VALID_CHAINS: readonly TokenChainFilter[] = [
  'all',
  'solana',
  'ethereum',
  'base',
];

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
/** Narrative window used to tag tokens. Always 1h — the link layer
 *  follows the freshest news, regardless of which token window the
 *  caller asks for. */
const TAG_NARRATIVE_WINDOW: TimeWindow = '1h';

function parseEnum<T extends string>(
  raw: string | null,
  valid: readonly T[],
  fallback: T
): T {
  if (raw && (valid as readonly string[]).includes(raw)) return raw as T;
  return fallback;
}

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function applyChain(tokens: Token[], chain: TokenChainFilter): Token[] {
  if (chain === 'all') return tokens;
  return tokens.filter((t) => t.chain === chain);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const window = parseEnum(
    url.searchParams.get('window'),
    VALID_WINDOWS,
    '24h'
  );
  const filter = parseEnum(
    url.searchParams.get('filter'),
    VALID_FILTERS,
    'trending'
  );
  const chain = parseEnum(
    url.searchParams.get('chain'),
    VALID_CHAINS,
    'all'
  );
  const limit = parseLimit(url.searchParams.get('limit'));

  const tokenSource = getActiveTokenSource();
  const narrativeSource = getActiveSourceMode();
  const linkedKey = `linked:tokens:${tokenSource}:${narrativeSource}:${window}`;

  // Hot path — cached linked universe; only the slice step runs here.
  const cached = await cacheGet(linkedKey);
  if (cached) {
    const universe = JSON.parse(cached) as Token[];
    const sliced = sliceUniverse(universe, filter, chain, window, limit);
    return NextResponse.json(
      {
        source: tokenSource,
        window,
        filter,
        chain,
        cached: true,
        tokens: sliced,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Cold path — pull raw token universe and the 1h narratives in
  // parallel, then run the tagger. One narrative fetch + one token
  // fetch per cold-start; subsequent permutations share the cache.
  const provider = getTokenProvider();
  const narrativeProvider = getProvider();

  let rawTokens: Token[] = [];
  let narratives: Narrative[] = [];
  try {
    [rawTokens, narratives] = await Promise.all([
      provider.fetch({ window, filter: 'trending', chain: 'all', limit: MAX_LIMIT }),
      narrativeProvider.fetch(TAG_NARRATIVE_WINDOW),
    ]);
  } catch (err) {
    console.error('[tokens] cold-path fetch failed', err);
  }

  const { tokens: tagged } = linkAll(rawTokens, narratives);

  if (tagged.length > 0) {
    await cacheSet(
      linkedKey,
      JSON.stringify(tagged),
      WINDOW_TTL_SECONDS[window]
    );
  }

  const sliced = sliceUniverse(tagged, filter, chain, window, limit);

  return NextResponse.json(
    {
      source: tokenSource,
      window,
      filter,
      chain,
      cached: false,
      tokens: sliced,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/** Apply chain + filter + limit on a linked universe. Mirrors the
 *  ranking logic baked into each provider; running here lets us share
 *  one cache entry across many request permutations. */
function sliceUniverse(
  tokens: Token[],
  filter: TokenFilter,
  chain: TokenChainFilter,
  window: TimeWindow,
  limit: number
): Token[] {
  const chained = applyChain(tokens, chain);
  const working = chained.slice();
  switch (filter) {
    case 'gainers':
      working.sort((a, b) => priceChange(b, window) - priceChange(a, window));
      break;
    case 'losers':
      working.sort((a, b) => priceChange(a, window) - priceChange(b, window));
      break;
    case 'new':
      return working
        .filter((t) => t.age > 0 && t.age < 24)
        .sort((a, b) => a.age - b.age)
        .slice(0, limit);
    case 'trending':
    default:
      // Provider returned the universe already sorted by activity.
      break;
  }
  return working.slice(0, limit);
}

function priceChange(t: Token, window: TimeWindow): number {
  if (window === '1h') return t.priceChange1h ?? t.priceChange24h;
  return t.priceChange24h;
}
