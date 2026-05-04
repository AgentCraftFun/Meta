import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { getActiveSourceMode, getProvider } from '@/lib/providers';
import type { Narrative, TimeWindow } from '@/lib/types';

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
  const source = getActiveSourceMode();
  const cacheKey = `narratives:${source}:${window}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(
      {
        source,
        window,
        cached: true,
        narratives: JSON.parse(cached) as Narrative[],
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const provider = getProvider();
  let narratives: Narrative[] = [];
  try {
    narratives = await provider.fetch(window);
  } catch (err) {
    console.error('[narratives] provider error', err);
    narratives = [];
  }

  if (narratives.length > 0) {
    await cacheSet(cacheKey, JSON.stringify(narratives), WINDOW_TTL_SECONDS[window]);
  }

  return NextResponse.json(
    {
      source,
      window,
      cached: false,
      narratives,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
