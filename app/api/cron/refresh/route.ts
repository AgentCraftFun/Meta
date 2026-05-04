import { NextResponse } from 'next/server';
import { cacheSet } from '@/lib/cache';
import { getActiveSourceMode, getProvider } from '@/lib/providers';
import type { Narrative, TimeWindow } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // long-running refresh

const WINDOWS: TimeWindow[] = ['1h', '24h', '7d'];
const TTL: Record<TimeWindow, number> = {
  '1h': 5 * 60,
  '24h': 60 * 60,
  '7d': 6 * 60 * 60,
};

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // unauthenticated allowed in dev
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 });
  }

  const source = getActiveSourceMode();
  const provider = getProvider();
  const started = Date.now();
  const summary: Record<TimeWindow, number> = { '1h': 0, '24h': 0, '7d': 0 };

  for (const window of WINDOWS) {
    try {
      const ns: Narrative[] = await provider.fetch(window);
      if (ns.length > 0) {
        await cacheSet(`narratives:${source}:${window}`, JSON.stringify(ns), TTL[window]);
      }
      summary[window] = ns.length;
    } catch (err) {
      console.error(`[cron] refresh ${window} failed`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    source,
    durationMs: Date.now() - started,
    counts: summary,
  });
}
