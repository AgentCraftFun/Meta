import Anthropic from '@anthropic-ai/sdk';
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
 * Token-level explanation endpoint. Generates a 2–3 sentence prose
 * answer to "why is this moving?" by feeding Claude Haiku 4.5 a
 * compact JSON brief built from:
 *
 *   - token recent metrics (price changes, volume, txns, liquidity)
 *   - top 3 narrative tags currently linked to the token
 *   - those narratives' titles + summaries (recent-event context)
 *
 * Cached for 5 minutes in the same KV layer the rest of the cache
 * uses. Cache key includes a hash of the relevant signal set so the
 * explanation invalidates when the narrative mix changes.
 *
 * Graceful degradation:
 *   - No ANTHROPIC_API_KEY → returns { explanation: null, reason: 'no_api_key' }.
 *   - Token has 0 narrative tags → returns the empty-state copy.
 *   - LLM call fails → returns { explanation: null, reason: 'llm_error' }.
 * The UI shows the empty state for all `null` cases.
 */

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 220;
const TTL_SECONDS = 5 * 60;
const VALID_CHAINS: TokenChain[] = ['solana', 'ethereum', 'base', 'bsc', 'other'];

let warnedNoKey = false;

type Brief = {
  symbol: string;
  name: string;
  chain: TokenChain;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  liquidityUsd: number | null;
  fdv: number | null;
  priceChange: {
    m5: number | null;
    h1: number | null;
    h6: number | null;
    h24: number;
  };
  txns24h: { buys: number | null; sells: number | null };
  ageHours: number;
  narratives: { id: string; label: string; title: string; summary: string }[];
};

type ApiResponse = {
  explanation: string | null;
  generatedAt: string;
  citations: { id: string; label: string }[];
  reason?: 'no_signal' | 'no_api_key' | 'llm_error' | 'not_found';
  cached?: boolean;
};

function normaliseChain(raw: string): TokenChain {
  const lc = raw.toLowerCase() as TokenChain;
  return VALID_CHAINS.includes(lc) ? lc : 'other';
}

export async function GET(
  _req: Request,
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

  const token = await resolveToken(chain, address);
  if (!token) {
    return ok({
      explanation: null,
      generatedAt: new Date().toISOString(),
      citations: [],
      reason: 'not_found',
    });
  }

  const narratives = await loadNarratives();
  const [tagged] = tagTokens([token], narratives);
  const linked = (tagged ?? token).narrativeTags;
  if (linked.length === 0) {
    return ok({
      explanation: null,
      generatedAt: new Date().toISOString(),
      citations: [],
      reason: 'no_signal',
    });
  }

  const brief = buildBrief(tagged ?? token, narratives);
  const cacheKey = `explanation:${tokenSource}:${narrativeSource}:${chain}:${address.toLowerCase()}:${briefHash(brief)}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached) as ApiResponse;
    return ok({ ...parsed, cached: true });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      console.warn(
        '[explanation] ANTHROPIC_API_KEY unset — returning empty state.'
      );
    }
    return ok({
      explanation: null,
      generatedAt: new Date().toISOString(),
      citations: [],
      reason: 'no_api_key',
    });
  }

  const explanation = await runClaude(brief);
  if (!explanation) {
    return ok({
      explanation: null,
      generatedAt: new Date().toISOString(),
      citations: brief.narratives.map((n) => ({ id: n.id, label: n.label })),
      reason: 'llm_error',
    });
  }

  const response: ApiResponse = {
    explanation,
    generatedAt: new Date().toISOString(),
    citations: brief.narratives.map((n) => ({ id: n.id, label: n.label })),
  };
  await cacheSet(cacheKey, JSON.stringify(response), TTL_SECONDS);
  return ok(response);
}

function ok(body: ApiResponse) {
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function resolveToken(
  chain: TokenChain,
  address: string
): Promise<Token | null> {
  const provider = getTokenProvider();
  if (provider instanceof DexscreenerTokenProvider) {
    try {
      return await provider.getByAddress(address);
    } catch (err) {
      console.error('[explanation] dex lookup failed', err);
    }
  }
  try {
    const universe = await provider.fetch({
      window: '1h',
      filter: 'trending',
      chain: 'all',
      limit: 200,
    });
    return (
      universe.find(
        (t) =>
          (t.contractAddress ?? '').toLowerCase() === address.toLowerCase() &&
          (chain === 'other' || t.chain === chain)
      ) ?? null
    );
  } catch {
    return null;
  }
}

async function loadNarratives(): Promise<Narrative[]> {
  try {
    return await getProvider().fetch('1h');
  } catch {
    return [];
  }
}

function buildBrief(token: Token, narratives: Narrative[]): Brief {
  const linkedIds = new Set(token.narrativeTags.map((t) => t.id));
  const matched = narratives.filter((n) => linkedIds.has(n.id)).slice(0, 3);
  return {
    symbol: token.symbol,
    name: token.name,
    chain: token.chain,
    priceUsd: token.priceUsd,
    marketCap: token.marketCap,
    volume24h: token.volume24h,
    liquidityUsd: token.liquidityUsd ?? null,
    fdv: token.fdv ?? null,
    priceChange: {
      m5: token.priceChange5m ?? null,
      h1: token.priceChange1h ?? null,
      h6: token.priceChange6h ?? null,
      h24: token.priceChange24h,
    },
    txns24h: {
      buys: token.buys24h ?? null,
      sells: token.sells24h ?? null,
    },
    ageHours: token.age,
    narratives: matched.map((n) => ({
      id: n.id,
      label: n.tagLabel || n.title.slice(0, 40),
      title: n.title,
      summary: n.summary,
    })),
  };
}

/** Stable FNV-style hash so the cache key changes when (and only when)
 *  any signal value actually changed. */
function briefHash(b: Brief): string {
  const blob = JSON.stringify([
    Math.round(b.priceChange.h24),
    Math.round(b.priceChange.h1 ?? 0),
    Math.round(b.volume24h / 1000),
    b.narratives.map((n) => n.id).join(','),
  ]);
  let h = 2166136261;
  for (let i = 0; i < blob.length; i++) {
    h ^= blob.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

async function runClaude(brief: Brief): Promise<string | null> {
  const client = new Anthropic();
  try {
    const result = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Signals:\n${JSON.stringify(brief, null, 2)}\n\nWrite the explanation.`,
        },
      ],
    });
    // The first text block is the explanation. Trim, drop accidental
    // markdown emphasis, cap at 320 chars defensively.
    for (const block of result.content) {
      if (block.type === 'text') {
        return block.text.trim().replace(/^["']|["']$/g, '').slice(0, 320);
      }
    }
    return null;
  } catch (err) {
    console.error('[explanation] anthropic call failed', err);
    return null;
  }
}

const SYSTEM_PROMPT = `You write 2–3 sentence factual explanations of why a crypto token may be moving.

Rules:
- Use ONLY the signals provided in the user message. Do not invent facts, dates, or partnerships.
- Cite the linked narratives by their label inline when relevant (e.g. "the Frog memes rotation").
- Be analytical, not promotional. No "to the moon", no price predictions, no investment advice.
- If signals are weak (low volume, small price move, no momentum), say so directly.
- Plain prose. No bullet points, no markdown headings, no emoji.
- Keep total output under 60 words.`;
