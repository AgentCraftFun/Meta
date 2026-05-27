import { NextResponse } from 'next/server';
import { cacheBackend, cacheGet, cacheSet } from '@/lib/cache';
import { getActiveSourceMode } from '@/lib/providers';
import { getActiveTokenSource } from '@/lib/providers/tokenProviders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Surfaces enough state to diagnose live deployments at a glance.
 *
 *   sources       — which provider modes are active (narrative + token)
 *   cache.backend — 'upstash' if both env vars set, else 'memory'
 *   cache.ping    — performs a real round-trip set+get to confirm Upstash
 *                   actually works, surfacing 'ok' / 'failed' / 'skipped'
 *   features      — feature-flagged extras the user might forget to set
 */
export async function GET() {
  const cachePing = await pingCache();
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    sources: {
      narrative: getActiveSourceMode(),
      token: getActiveTokenSource(),
    },
    cache: {
      backend: cacheBackend(),
      ping: cachePing,
    },
    features: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      cronSecret: Boolean(process.env.CRON_SECRET),
      xBearer: Boolean(process.env.X_BEARER_TOKEN),
    },
  });
}

async function pingCache(): Promise<'ok' | 'failed' | 'skipped'> {
  if (cacheBackend() !== 'upstash') return 'skipped';
  const key = `health:ping:${Date.now().toString(36)}`;
  try {
    await cacheSet(key, '1', 10);
    const got = await cacheGet(key);
    return got === '1' ? 'ok' : 'failed';
  } catch {
    return 'failed';
  }
}
