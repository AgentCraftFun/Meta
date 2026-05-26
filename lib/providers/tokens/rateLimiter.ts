/**
 * Token-bucket rate limiter. Process-local — sufficient for a single
 * serverless instance / cron tick. Two buckets are exported so different
 * upstream tiers can be shared across the call sites:
 *
 *   dexMain   — 300 req/min  (search, /tokens/{addr}, /pairs/{chain}/{pair})
 *   dexBoosts —  60 req/min  (/token-boosts/latest, /token-boosts/top)
 *
 * Each call site does `await bucket.acquire()` before `fetch()`. When the
 * bucket is empty we wait the refill interval and try again, logging once
 * per queue event so quota pressure is visible in serverless logs.
 */

const QUEUE_LOG_PREFIX = '[dex/rate-limiter]';

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  /**
   * @param name              Tag used in queue-log lines.
   * @param capacity          Max burst size (= per-minute budget here).
   * @param refillPerSecond   Steady-state rate (= capacity / 60 for the
   *                          per-minute APIs we wrap).
   */
  constructor(
    public readonly name: string,
    private readonly capacity: number,
    private readonly refillPerSecond: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /** Available tokens after a synthetic refill — for tests / metrics. */
  available(): number {
    this.refill();
    return this.tokens;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Out of tokens — compute how long until one regenerates and wait.
    const waitMs = Math.max(10, Math.ceil(1000 / this.refillPerSecond));
    // Log once per queue event so spikes are visible without flooding.
    console.log(
      `${QUEUE_LOG_PREFIX} ${this.name}: bucket empty, queueing for ${waitMs}ms`
    );
    await sleep(waitMs);
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    if (elapsed <= 0) return;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillPerSecond
    );
    this.lastRefill = now;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 300 req/min budget for the main DexScreener endpoints. */
export const dexMain = new TokenBucket('dexMain', 300, 300 / 60);

/** 60 req/min budget for the token-boosts endpoints. */
export const dexBoosts = new TokenBucket('dexBoosts', 60, 60 / 60);
