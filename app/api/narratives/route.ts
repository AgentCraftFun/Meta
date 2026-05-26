import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { inverseLink, tagTokens } from '@/lib/narrativeTagger';
import { getActiveSourceMode, getProvider } from '@/lib/providers';
import {
  getActiveTokenSource,
  getTokenProvider,
} from '@/lib/providers/tokenProviders';
import type { Narrative, TimeWindow } from '@/lib/types';
import type { Token } from '@/lib/types/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_TTL_SECONDS: Record<TimeWindow, number> = {
  '1h': 5 * 60, // 5 min
  '24h': 60 * 60, // 1 h
  '7d': 6 * 60 * 60, // 6 h
};

const VALID_WINDOWS: TimeWindow[] = ['1h', '24h', '7d'];

function parseWindow(raw: string | null): TimeWindow {
  if (raw && (VALID_WINDOWS as string[]).includes(raw)) return raw as TimeWindow;
  return '24h';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const window = parseWindow(url.searchParams.get('window'));
  const narrativeSource = getActiveSourceMode();
  const tokenSource = getActiveTokenSource();
  const linkedKey = `linked:narratives:${narrativeSource}:${tokenSource}:${window}`;

  const cached = await cacheGet(linkedKey);
  if (cached) {
    return NextResponse.json(
      {
        source: narrativeSource,
        window,
        cached: true,
        narratives: JSON.parse(cached) as Narrative[],
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const narrativeProvider = getProvider();
  const tokenProvider = getTokenProvider();

  let narratives: Narrative[] = [];
  let tokens: Token[] = [];
  try {
    [narratives, tokens] = await Promise.all([
      narrativeProvider.fetch(window),
      tokenProvider.fetch({
        window,
        filter: 'trending',
        chain: 'all',
        limit: 200,
      }),
    ]);
  } catch (err) {
    console.error('[narratives] provider error', err);
  }

  // Tag tokens first so each token carries the narrative ids that
  // matched, then walk them to populate relatedTokenIds on each
  // narrative. No upstream calls — pure data linking.
  const taggedTokens = tagTokens(tokens, narratives);
  const linked = inverseLink(narratives, taggedTokens);

  if (linked.length > 0) {
    await cacheSet(
      linkedKey,
      JSON.stringify(linked),
      WINDOW_TTL_SECONDS[window]
    );
  }

  return NextResponse.json(
    {
      source: narrativeSource,
      window,
      cached: false,
      narratives: linked,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
