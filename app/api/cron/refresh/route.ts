import { NextResponse } from 'next/server';
import { cacheSet } from '@/lib/cache';
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
export const maxDuration = 300; // long-running refresh

const WINDOWS: TimeWindow[] = ['1h', '24h', '7d'];

/**
 * TTL by window. Linked caches use the token-side TTLs since they
 * absorb both narrative + token movement.
 *
 *   1h  → 5 min
 *   24h → 15 min   (narratives use 1h instead — slower aggregate)
 *   7d  → 1 h      (narratives use 6 h)
 */
const NARRATIVE_TTL: Record<TimeWindow, number> = {
  '1h': 5 * 60,
  '24h': 60 * 60,
  '7d': 6 * 60 * 60,
};
const TOKEN_TTL: Record<TimeWindow, number> = {
  '1h': 5 * 60,
  '24h': 15 * 60,
  '7d': 60 * 60,
};

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

/**
 * DESIGN NOTE — single cron, link-aware:
 *
 * The link layer collapses what used to be 48 token cache permutations
 * into 3 linked-universe entries (one per window). The cron now warms:
 *
 *   linked:tokens:<tokenSrc>:<narrativeSrc>:<window>      ×3
 *   linked:narratives:<narrativeSrc>:<tokenSrc>:<window>  ×3
 *
 * Both routes pull the linked entry on hot reads and slice in memory.
 * Upstream cost per tick is dominated by the DexScreener provider's
 * single boost-list call + batched token lookup (memoised for 60s
 * across the 3 windows of warming inside one tick).
 *
 * Splitting into /api/cron/refresh-tokens stays optional — only worth
 * it if token warming needs a different cadence (e.g. 1-min for
 * breakout discovery). For now: one endpoint, one schedule.
 */
export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorised' },
      { status: 401 }
    );
  }

  const started = Date.now();
  const narrativeSource = getActiveSourceMode();
  const tokenSource = getActiveTokenSource();
  const narrativeProvider = getProvider();
  const tokenProvider = getTokenProvider();

  // 1h narratives drive tagging for every token window — fetch once.
  let liveNarratives: Narrative[] = [];
  try {
    liveNarratives = await narrativeProvider.fetch('1h');
  } catch (err) {
    console.error('[cron] 1h narratives fetch failed', err);
  }

  const tokenSummary: Record<TimeWindow, number> = {
    '1h': 0,
    '24h': 0,
    '7d': 0,
  };
  const narrativeSummary: Record<TimeWindow, number> = {
    '1h': 0,
    '24h': 0,
    '7d': 0,
  };

  for (const window of WINDOWS) {
    // Tokens for this window, tagged against live narratives.
    let rawTokens: Token[] = [];
    try {
      rawTokens = await tokenProvider.fetch({
        window,
        filter: 'trending',
        chain: 'all',
        limit: 200,
      });
    } catch (err) {
      console.error(`[cron] tokens ${window} fetch failed`, err);
    }

    const taggedTokens = tagTokens(rawTokens, liveNarratives);
    if (taggedTokens.length > 0) {
      await cacheSet(
        `linked:tokens:${tokenSource}:${narrativeSource}:${window}`,
        JSON.stringify(taggedTokens),
        TOKEN_TTL[window]
      );
      tokenSummary[window] = taggedTokens.length;
    }

    // Narratives for this window, inverse-linked against same-window
    // tokens. We tag separately per window so relatedTokenIds reflects
    // each window's token universe (1h is breakouts, 7d is established).
    let narrativesForWindow: Narrative[] = [];
    try {
      narrativesForWindow = await narrativeProvider.fetch(window);
    } catch (err) {
      console.error(`[cron] narratives ${window} fetch failed`, err);
    }

    if (narrativesForWindow.length > 0) {
      const tokensForInverse = tagTokens(rawTokens, narrativesForWindow);
      const linked = inverseLink(narrativesForWindow, tokensForInverse);
      await cacheSet(
        `linked:narratives:${narrativeSource}:${tokenSource}:${window}`,
        JSON.stringify(linked),
        NARRATIVE_TTL[window]
      );
      narrativeSummary[window] = linked.length;
    }
  }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - started,
    sources: { narrative: narrativeSource, token: tokenSource },
    tokens: tokenSummary,
    narratives: narrativeSummary,
  });
}
