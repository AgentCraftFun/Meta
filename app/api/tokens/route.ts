import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import {
  getActiveTokenSource,
  getTokenProvider,
} from '@/lib/providers/tokenProviders';
import type { TimeWindow } from '@/lib/types';
import type { Token } from '@/lib/types/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_TTL_SECONDS: Record<TimeWindow, number> = {
  '1h': 5 * 60,
  '24h': 60 * 60,
  '7d': 6 * 60 * 60,
};

const VALID_WINDOWS: TimeWindow[] = ['1h', '24h', '7d'];

function parseWindow(raw: string | null): TimeWindow {
  if (raw && (VALID_WINDOWS as string[]).includes(raw)) return raw as TimeWindow;
  return '24h';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const window = parseWindow(url.searchParams.get('window'));
  const source = getActiveTokenSource();
  const cacheKey = `tokens:${source}:${window}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(
      {
        source,
        window,
        cached: true,
        tokens: JSON.parse(cached) as Token[],
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const provider = getTokenProvider();
  let tokens: Token[] = [];
  try {
    tokens = await provider.fetch(window);
  } catch (err) {
    console.error('[tokens] provider error', err);
    tokens = [];
  }

  if (tokens.length > 0) {
    await cacheSet(cacheKey, JSON.stringify(tokens), WINDOW_TTL_SECONDS[window]);
  }

  return NextResponse.json(
    {
      source,
      window,
      cached: false,
      tokens,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
