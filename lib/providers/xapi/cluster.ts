import type { Narrative, NarrativeCategory } from '../../types';
import type { XTrend, XTweet } from './client';
import { meanSentiment } from './sentiment';

export type ClusterInput = {
  iso: string;
  trend: XTrend;
  tweets: XTweet[];
};

export type Cluster = {
  iso: string;
  trend: string;
  tweets: XTweet[];
  uniqueAuthors: number;
  count: number;
  firstSeen: Date;
  lastUpdated: Date;
  /** Mean sentiment in [-1, 1]. */
  sentiment: number;
  /** [-1, 1]. Current-hour count vs trailing 5-hour mean. */
  momentum: number;
  /** Raw rank score used to pick top 10. */
  score: number;
};

const HOUR_MS = 60 * 60 * 1000;

function hourBucket(d: Date, anchor: number): number {
  return Math.floor((anchor - d.getTime()) / HOUR_MS);
}

/**
 * Compute current-hour vs trailing-5-hour-mean ratio, mapped into [-1, 1].
 * If we don't have enough data to compare, returns 0.
 */
function computeMomentum(tweets: XTweet[], now: number): number {
  if (tweets.length < 5) return 0;
  const buckets = new Array(6).fill(0);
  for (const t of tweets) {
    const b = hourBucket(new Date(t.created_at), now);
    if (b >= 0 && b < buckets.length) buckets[b] += 1;
  }
  const current = buckets[0];
  const trailing = (buckets[1] + buckets[2] + buckets[3] + buckets[4] + buckets[5]) / 5;
  if (trailing === 0) return current > 0 ? 1 : 0;
  const ratio = current / trailing;
  // Map [0, 3+] → [-1, 1] with 1.0 (no change) → 0.
  if (ratio >= 1) {
    return Math.min(1, (ratio - 1) / 2);
  }
  return Math.max(-1, ratio - 1);
}

function categoriseCluster(c: Cluster): NarrativeCategory {
  const ageH = (Date.now() - c.firstSeen.getTime()) / HOUR_MS;
  if (ageH < 1 && c.momentum > 0.6) return 'breaking';
  if (c.score < 30 && c.momentum > 0.4) return 'emerging';
  return 'trending';
}

function summarise(tweets: XTweet[]): string {
  // Pick the most-liked tweet as a one-line summary, stripping URLs/handles.
  const top = tweets
    .slice()
    .sort(
      (a, b) =>
        (b.public_metrics?.like_count ?? 0) -
        (a.public_metrics?.like_count ?? 0)
    )[0];
  if (!top) return '';
  return top.text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

/** Group an input set into a Cluster with derived metrics. */
export function buildCluster(input: ClusterInput): Cluster {
  const { iso, trend, tweets } = input;
  const authors = new Set(tweets.map((t) => t.author_id));
  const dates = tweets.map((t) => new Date(t.created_at));
  const firstSeen = dates.length
    ? new Date(Math.min(...dates.map((d) => d.getTime())))
    : new Date();
  const lastUpdated = dates.length
    ? new Date(Math.max(...dates.map((d) => d.getTime())))
    : new Date();

  const sentiment = meanSentiment(tweets.map((t) => t.text));
  const momentum = computeMomentum(tweets, Date.now());

  // Score = log-scaled count + unique-author bonus.
  const score = Math.log1p(tweets.length) * 10 + authors.size * 0.5;

  return {
    iso,
    trend: trend.trend,
    tweets,
    uniqueAuthors: authors.size,
    count: tweets.length,
    firstSeen,
    lastUpdated,
    sentiment,
    momentum,
    score,
  };
}

/**
 * Convert a sorted list of clusters for one country into Narrative[]. Volume
 * is normalised against the country's max-cluster score so per-country pin
 * sizes are comparable to other countries.
 */
export function clustersToNarratives(
  clusters: Cluster[],
  countryName: string,
  timeWindow: Narrative['timeWindow']
): Narrative[] {
  if (clusters.length === 0) return [];
  const sorted = clusters.slice().sort((a, b) => b.score - a.score).slice(0, 10);
  const max = sorted[0].score || 1;

  return sorted.map((c, i) => {
    const volume = Math.max(1, Math.round((c.score / max) * 100));
    const category = categoriseCluster(c);
    const summary = summarise(c.tweets);
    const keywords = deriveKeywords(c);
    return {
      id: `${c.iso}-${slug(c.trend)}-${i}`,
      country: c.iso,
      title: c.trend,
      summary: summary || `${c.count} posts about ${c.trend} from ${countryName}.`,
      volume,
      sentiment: Number(c.sentiment.toFixed(2)),
      momentum: Number(c.momentum.toFixed(2)),
      rank: i + 1,
      category,
      sources: c.tweets.slice(0, 3).map((t) => ({
        url: `https://x.com/i/web/status/${t.id}`,
        author: `@${t.author_id}`,
        text: t.text.replace(/\s+/g, ' ').trim().slice(0, 240),
      })),
      firstSeen: c.firstSeen.toISOString(),
      lastUpdated: c.lastUpdated.toISOString(),
      timeWindow,
      // Link-layer fields. Keywords pull from the trend term plus any
      // cashtags / hashtags surfaced in the clustered tweets — that's
      // the cheapest signal we have and lines up with how memecoin
      // tickers propagate on X.
      keywords,
      themes: [],
      tagLabel: c.trend,
      relatedTokenIds: [],
    } satisfies Narrative;
  });
}

/** Pull matching candidates from the trend term, cashtags, and the
 *  most-repeated hashtags in the cluster. Lowercased + deduped. */
function deriveKeywords(c: Cluster): string[] {
  const out = new Set<string>();
  // Trend term — strip leading $/#.
  const trendBase = c.trend.replace(/^[$#]/, '').toLowerCase();
  if (trendBase) out.add(trendBase);
  for (const t of c.tweets) {
    for (const tag of t.entities?.cashtags ?? []) {
      if (tag.tag) out.add(tag.tag.toLowerCase());
    }
    for (const tag of t.entities?.hashtags ?? []) {
      if (tag.tag) out.add(tag.tag.toLowerCase());
    }
  }
  return Array.from(out).slice(0, 12);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
