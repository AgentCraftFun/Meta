import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import {
  getActiveTokenSource,
  getTokenProvider,
} from '@/lib/providers/tokenProviders';
import type { TimeWindow } from '@/lib/types';
import type {
  Token,
  TokenChainFilter,
  TokenFilter,
} from '@/lib/types/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cache TTL per window — tighter for short windows since the data moves
 * faster. The cron warmer (/api/cron/refresh) repopulates all permutations
 * every 5 min so cold-reads off the cache stay snappy.
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
  const source = getActiveTokenSource();

  // Cache key intentionally excludes `limit` — we cache the full ranked
  // result (up to MAX_LIMIT) and slice on the way out so different limits
  // share the same upstream cost.
  const cacheKey = `tokens:${source}:${window}:${filter}:${chain}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    const tokens = (JSON.parse(cached) as Token[]).slice(0, limit);
    return NextResponse.json(
      { source, window, filter, chain, cached: true, tokens },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const provider = getTokenProvider();
  let tokens: Token[] = [];
  try {
    tokens = await provider.fetch({ window, filter, chain, limit: MAX_LIMIT });
  } catch (err) {
    console.error('[tokens] provider error', err);
    tokens = [];
  }

  if (tokens.length > 0) {
    await cacheSet(
      cacheKey,
      JSON.stringify(tokens),
      WINDOW_TTL_SECONDS[window]
    );
  }

  return NextResponse.json(
    {
      source,
      window,
      filter,
      chain,
      cached: false,
      tokens: tokens.slice(0, limit),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
