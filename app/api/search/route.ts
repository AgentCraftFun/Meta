import { NextResponse } from 'next/server';
import { cacheGet } from '@/lib/cache';
import {
  buildSearchResponse,
  matchCountries,
  matchWallets,
} from '@/lib/search/match';
import { getActiveSourceMode, getProvider } from '@/lib/providers';
import {
  getActiveTokenSource,
  getTokenProvider,
} from '@/lib/providers/tokenProviders';
import { DexscreenerTokenProvider } from '@/lib/providers/tokens/dexscreener';
import type { Narrative } from '@/lib/types';
import type { Token } from '@/lib/types/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_Q_LEN = 80;

/**
 * Fallback search backend. Client has already filtered its
 * React Query cache by the time we're reached, so the only reason
 * we get hit is the user typed a ticker / address we don't have in
 * the universe.
 *
 *   tokens     — DexScreener live search when the active token source
 *                is DexScreener, otherwise scan the in-memory cache.
 *   narratives — scan the cached linked-narratives entry for the 1h
 *                window (cheapest, freshest).
 *   countries  — local centroid scan (pure).
 *   wallets    — address regex (pure).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('q') ?? '';
  const q = raw.trim().slice(0, MAX_Q_LEN);

  if (!q) {
    return NextResponse.json(
      { q: '', tokens: [], narratives: [], countries: [], wallets: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Pure matchers first — no network.
  const countries = matchCountries(q);
  const wallets = matchWallets(q);

  const [tokens, narratives] = await Promise.all([
    searchTokens(q),
    searchNarratives(q),
  ]);

  const response = buildSearchResponse(q, tokens, narratives);
  // Pure-match results override the buildSearchResponse output for
  // countries / wallets (they don't need a token universe to compute).
  response.countries = countries;
  response.wallets = wallets;

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function searchTokens(q: string): Promise<Token[]> {
  const source = getActiveTokenSource();

  if (source === 'dexscreener') {
    try {
      const provider = getTokenProvider();
      if (provider instanceof DexscreenerTokenProvider) {
        return await provider.searchTokens(q, 10);
      }
    } catch (err) {
      console.error('[search] dexscreener search failed', err);
    }
  }

  // Fallback: pull from the linked-universe cache and filter in-process.
  // Same data the API route serves, so no extra upstream calls.
  const narrativeSource = getActiveSourceMode();
  const linked = await cacheGet(
    `linked:tokens:${source}:${narrativeSource}:1h`
  );
  if (linked) {
    try {
      return JSON.parse(linked) as Token[];
    } catch {
      return [];
    }
  }

  // Last-resort cold path — fetch the universe directly.
  try {
    const provider = getTokenProvider();
    return await provider.fetch({
      window: '1h',
      filter: 'trending',
      chain: 'all',
      limit: 200,
    });
  } catch (err) {
    console.error('[search] universe fetch failed', err);
    return [];
  }
}

async function searchNarratives(q: string): Promise<Narrative[]> {
  const narrativeSource = getActiveSourceMode();
  const tokenSource = getActiveTokenSource();
  const linked = await cacheGet(
    `linked:narratives:${narrativeSource}:${tokenSource}:1h`
  );
  if (linked) {
    try {
      return JSON.parse(linked) as Narrative[];
    } catch {
      return [];
    }
  }

  try {
    const provider = getProvider();
    return await provider.fetch('1h');
  } catch (err) {
    console.error('[search] narrative fetch failed', err);
    return [];
  }
}
