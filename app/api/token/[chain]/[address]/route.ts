import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { tagTokens } from '@/lib/narrativeTagger';
import { getActiveSourceMode, getProvider } from '@/lib/providers';
import {
  getActiveTokenSource,
  getTokenProvider,
} from '@/lib/providers/tokenProviders';
import { DexscreenerTokenProvider } from '@/lib/providers/tokens/dexscreener';
import type { Narrative } from '@/lib/types';
import type { Token, TokenChain } from '@/lib/types/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Single-token detail endpoint backing /token/[chain]/[address].
 *
 *   1. Lookup the canonical pair from DexScreener (or the mock universe
 *      for mock mode) by base-token address.
 *   2. Tag the token against the 1h narrative window so the detail
 *      page's context band is hydrated server-side.
 *   3. Cache the linked result for 60s to avoid hammering DexScreener
 *      on rapid back/forward navigation.
 */
const TTL_SECONDS = 60;

const VALID_CHAINS: TokenChain[] = ['solana', 'ethereum', 'base', 'bsc', 'other'];

function normaliseChain(raw: string): TokenChain {
  const lc = raw.toLowerCase() as TokenChain;
  return VALID_CHAINS.includes(lc) ? lc : 'other';
}

export async function GET(
  _request: Request,
  { params }: { params: { chain: string; address: string } }
) {
  const chain = normaliseChain(params.chain);
  const address = decodeURIComponent(params.address).trim();
  if (!address) {
    return NextResponse.json(
      { error: 'address required' },
      { status: 400 }
    );
  }

  const tokenSource = getActiveTokenSource();
  const narrativeSource = getActiveSourceMode();
  const cacheKey = `token:${tokenSource}:${narrativeSource}:${chain}:${address.toLowerCase()}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(
      { token: JSON.parse(cached) as Token, cached: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const token = await resolveToken(chain, address);
  if (!token) {
    return NextResponse.json(
      { token: null, cached: false, error: 'not_found' },
      { status: 404 }
    );
  }

  // Tag against the live narrative window so the context band is hot
  // on first paint.
  const narratives = await loadNarratives();
  const [tagged] = tagTokens([token], narratives);
  const final = tagged ?? token;

  await cacheSet(cacheKey, JSON.stringify(final), TTL_SECONDS);

  return NextResponse.json(
    { token: final, cached: false },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

async function resolveToken(
  chain: TokenChain,
  address: string
): Promise<Token | null> {
  const provider = getTokenProvider();

  // DexScreener provider has a typed lookup; everything else falls
  // back to scanning the trending universe for a match.
  if (provider instanceof DexscreenerTokenProvider) {
    try {
      return await provider.getByAddress(address);
    } catch (err) {
      console.error('[token-detail] dex lookup failed', err);
    }
  }

  try {
    const universe = await provider.fetch({
      window: '1h',
      filter: 'trending',
      chain: 'all',
      limit: 200,
    });
    const match = universe.find(
      (t) =>
        (t.contractAddress ?? '').toLowerCase() === address.toLowerCase() &&
        (chain === 'other' || t.chain === chain)
    );
    return match ?? null;
  } catch (err) {
    console.error('[token-detail] universe scan failed', err);
    return null;
  }
}

async function loadNarratives(): Promise<Narrative[]> {
  try {
    return await getProvider().fetch('1h');
  } catch (err) {
    console.error('[token-detail] narrative load failed', err);
    return [];
  }
}
