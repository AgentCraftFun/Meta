/**
 * Thin wrapper around the X (Twitter) v2 endpoints used by MetaMap. Bearer-
 * token auth via X_BEARER_TOKEN. Reports rate-limit headers so the orchestrator
 * can back off before quota is exhausted.
 */

const X_API_BASE = 'https://api.x.com';

export type XTweet = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    hashtags?: { tag: string }[];
    cashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { url: string }[];
  };
};

export type XSearchResponse = {
  data?: XTweet[];
  meta?: { next_token?: string; result_count: number };
};

export type XTrend = {
  trend: string;
  /** Optional 24h tweet volume reported by the API. */
  tweet_volume?: number | null;
};

export type RateLimit = {
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
};

class RateLimitError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly resetAt: number
  ) {
    super(`X API rate-limited on ${endpoint}, resets at ${new Date(resetAt).toISOString()}`);
  }
}

export { RateLimitError };

function readRateLimit(res: Response): RateLimit | null {
  const limit = res.headers.get('x-rate-limit-limit');
  const remaining = res.headers.get('x-rate-limit-remaining');
  const reset = res.headers.get('x-rate-limit-reset');
  if (!limit || !remaining || !reset) return null;
  return {
    limit: Number(limit),
    remaining: Number(remaining),
    resetAt: Number(reset) * 1000,
  };
}

async function call<T>(path: string, params: Record<string, string>) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error('X_BEARER_TOKEN is not set');

  const url = new URL(path, X_API_BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const rl = readRateLimit(res);

  if (res.status === 429) {
    throw new RateLimitError(path, rl?.resetAt ?? Date.now() + 60_000);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`X API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as T;
  return { data: json, rateLimit: rl };
}

/** GET /2/trends/by/woeid/:woeid — top trends for a location. */
export async function fetchTrends(woeid: number) {
  return call<{ data: XTrend[] }>(`/2/trends/by/woeid/${woeid}`, {});
}

/**
 * GET /2/tweets/search/recent — country-targeted recent search.
 *
 * `query` is built by the orchestrator. We ask for created_at + author_id +
 * entities + public_metrics so clustering can run without follow-up calls.
 */
export async function searchRecent(opts: {
  query: string;
  maxResults?: number;
  startTime?: string; // ISO
  endTime?: string;
}) {
  return call<XSearchResponse>(`/2/tweets/search/recent`, {
    query: opts.query,
    max_results: String(opts.maxResults ?? 100),
    'tweet.fields': 'created_at,author_id,entities,public_metrics,lang',
    start_time: opts.startTime ?? '',
    end_time: opts.endTime ?? '',
  });
}
