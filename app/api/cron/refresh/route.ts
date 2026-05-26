import { NextResponse } from 'next/server';
import { cacheSet } from '@/lib/cache';
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
export const maxDuration = 300; // long-running refresh

const WINDOWS: TimeWindow[] = ['1h', '24h', '7d'];
const FILTERS: TokenFilter[] = ['trending', 'gainers', 'losers', 'new'];
const CHAINS: TokenChainFilter[] = ['all', 'solana', 'ethereum', 'base'];

/**
 * Cache TTL strategy. Token windows match the API route's TTLs so warm
 * + cold reads converge. Narrative TTLs are wider since X data moves
 * slower at the country aggregate level.
 *
 *   1h  → 5 min   (token + narrative)
 *   24h → 15 min  (token), 1h (narrative)
 *   7d  → 1 h     (token), 6 h (narrative)
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
  if (!secret) return true; // unauthenticated allowed in dev
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

/**
 * DESIGN NOTE — why one cron endpoint, not two:
 *
 * The DexScreener provider memoises an enriched universe in-process for
 * 60s, so warming the 3×4×4 = 48 token cache permutations triggers ~2
 * boost calls + ~2 token-batch calls TOTAL, not 192. Folding token
 * warming into the existing narrative cron also keeps the Vercel cron
 * surface single-tab and the 5-min schedule shared.
 *
 * If token warming ever needs a different cadence (e.g. 1-min for
 * breakout discovery), split into /api/cron/refresh-tokens then.
 */
export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json(
      { ok: false, error: 'unauthorised' },
      { status: 401 }
    );
  }

  const started = Date.now();

  const [narratives, tokens] = await Promise.all([
    refreshNarratives(),
    refreshTokens(),
  ]);

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - started,
    narratives,
    tokens,
  });
}

async function refreshNarratives() {
  const source = getActiveSourceMode();
  const provider = getProvider();
  const counts: Record<TimeWindow, number> = { '1h': 0, '24h': 0, '7d': 0 };

  for (const window of WINDOWS) {
    try {
      const ns: Narrative[] = await provider.fetch(window);
      if (ns.length > 0) {
        await cacheSet(
          `narratives:${source}:${window}`,
          JSON.stringify(ns),
          NARRATIVE_TTL[window]
        );
      }
      counts[window] = ns.length;
    } catch (err) {
      console.error(`[cron] narratives ${window} failed`, err);
    }
  }
  return { source, counts };
}

async function refreshTokens() {
  const source = getActiveTokenSource();
  const provider = getTokenProvider();
  let written = 0;
  let failed = 0;

  for (const window of WINDOWS) {
    for (const filter of FILTERS) {
      for (const chain of CHAINS) {
        try {
          const set: Token[] = await provider.fetch({
            window,
            filter,
            chain,
            limit: 200,
          });
          if (set.length > 0) {
            await cacheSet(
              `tokens:${source}:${window}:${filter}:${chain}`,
              JSON.stringify(set),
              TOKEN_TTL[window]
            );
            written += 1;
          }
        } catch (err) {
          failed += 1;
          console.error(
            `[cron] tokens ${window}/${filter}/${chain} failed`,
            err
          );
        }
      }
    }
  }

  return { source, written, failed };
}
