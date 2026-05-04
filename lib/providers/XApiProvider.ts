import { cacheGet, cacheSet } from '../cache';
import type { Narrative, TimeWindow } from '../types';
import type { NarrativeProvider } from './NarrativeProvider';
import {
  RateLimitError,
  fetchTrends,
  searchRecent,
  type RateLimit,
  type XTrend,
  type XTweet,
} from './xapi/client';
import { buildCluster, clustersToNarratives } from './xapi/cluster';
import { PRIORITY_COUNTRIES } from './xapi/woeids';

const MIN_REMAINING = 5;
const PER_COUNTRY_TRENDS = 5;
const SEARCH_HOURS = 6;
const SNAPSHOT_KEY = (window: TimeWindow) => `narratives:x:snapshot:${window}`;
const SNAPSHOT_TTL_S = 60 * 60 * 24; // 24h: snapshots live well past rate-limit windows.

/**
 * X v2 implementation of the narrative provider. Refreshes by:
 *
 *   1. /2/trends/by/woeid for each priority country
 *   2. /2/tweets/search/recent over the last SEARCH_HOURS, OR-joining the
 *      country's top trend names so one call covers the cluster space
 *   3. cluster the returned tweets per-trend, score, and emit Narrative[]
 *
 * On rate-limit (or transient error) the most recent successful snapshot
 * is served from Redis instead.
 */
export class XApiProvider implements NarrativeProvider {
  readonly id = 'x' as const;

  async fetch(window: TimeWindow): Promise<Narrative[]> {
    if (!process.env.X_BEARER_TOKEN) {
      console.warn('[xapi] X_BEARER_TOKEN missing; returning empty');
      return [];
    }

    try {
      const narratives = await this.refresh(window);
      if (narratives.length > 0) {
        await cacheSet(SNAPSHOT_KEY(window), JSON.stringify(narratives), SNAPSHOT_TTL_S);
      }
      return narratives;
    } catch (err) {
      console.error('[xapi] refresh failed, falling back to snapshot', err);
      const snapshot = await cacheGet(SNAPSHOT_KEY(window));
      if (snapshot) return JSON.parse(snapshot) as Narrative[];
      return [];
    }
  }

  private async refresh(window: TimeWindow): Promise<Narrative[]> {
    const startTime = new Date(Date.now() - SEARCH_HOURS * 60 * 60 * 1000).toISOString();
    const out: Narrative[] = [];
    let lastRate: RateLimit | null = null;

    for (const country of PRIORITY_COUNTRIES) {
      // Bail if we're about to exhaust quota — the cron will pick up later.
      if (lastRate && lastRate.remaining < MIN_REMAINING) {
        console.warn(
          `[xapi] near rate limit (${lastRate.remaining}/${lastRate.limit}); stopping after ${out.length} narratives`
        );
        break;
      }

      try {
        const { data: trendsRes, rateLimit: trendsRl } = await fetchTrends(country.woeid);
        if (trendsRl) lastRate = trendsRl;
        const trends = (trendsRes.data ?? []).slice(0, PER_COUNTRY_TRENDS);
        if (trends.length === 0) continue;

        // Build a single OR-joined query for the country so we use one
        // search/recent call per country instead of one per trend.
        const query = buildCountryQuery(trends, country.lang);
        const { data: searchRes, rateLimit: searchRl } = await searchRecent({
          query,
          maxResults: 100,
          startTime,
        });
        if (searchRl) lastRate = searchRl;
        const tweets = searchRes.data ?? [];

        // Bucket tweets per trend.
        const buckets = bucketByTrend(tweets, trends);
        const clusters = trends.map((t) =>
          buildCluster({ iso: country.iso, trend: t, tweets: buckets.get(t.trend) ?? [] })
        );
        out.push(...clustersToNarratives(clusters, country.name, window));
      } catch (err) {
        if (err instanceof RateLimitError) {
          console.warn(
            `[xapi] rate-limited on ${err.endpoint}, stopping at ${out.length} narratives`
          );
          break;
        }
        // One country's failure shouldn't kill the whole refresh.
        console.error(`[xapi] country ${country.iso} failed`, err);
      }
    }

    return out;
  }
}

/** Build an OR-joined `(trend1 OR trend2 …) lang:xx -is:retweet` query. */
function buildCountryQuery(trends: XTrend[], lang?: string): string {
  const terms = trends.map((t) => quoteTerm(t.trend)).join(' OR ');
  let q = `(${terms}) -is:retweet`;
  if (lang) q += ` lang:${lang}`;
  return q;
}

function quoteTerm(term: string): string {
  // Hashtags + cashtags can stand alone; multi-word phrases need quoting.
  if (term.startsWith('#') || term.startsWith('$')) return term;
  if (/\s/.test(term)) return `"${term.replace(/"/g, '')}"`;
  return term;
}

/**
 * Drop each tweet into the first matching trend bucket (case-insensitive
 * substring or hashtag match).
 */
function bucketByTrend(tweets: XTweet[], trends: XTrend[]): Map<string, XTweet[]> {
  const out = new Map<string, XTweet[]>();
  for (const t of trends) out.set(t.trend, []);

  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase();
    const hashtags = (tweet.entities?.hashtags ?? []).map((h) => `#${h.tag.toLowerCase()}`);
    const cashtags = (tweet.entities?.cashtags ?? []).map((c) => `$${c.tag.toLowerCase()}`);
    let matched: string | null = null;
    for (const t of trends) {
      const needle = t.trend.toLowerCase();
      if (
        text.includes(needle) ||
        hashtags.includes(needle) ||
        cashtags.includes(needle)
      ) {
        matched = t.trend;
        break;
      }
    }
    if (matched) out.get(matched)!.push(tweet);
  }
  return out;
}
