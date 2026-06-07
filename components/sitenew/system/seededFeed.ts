/**
 * Seeded, reproducible ambient data for the /siteNEW liveness layer. No
 * randomness at runtime → no CPU spikes, identical every load.
 */

/** mulberry32 — tiny deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type FeedEvent = {
  cc: string;
  text: string;
  vol: number;
  mom?: number;
  tone: 'cyan' | 'amber' | 'red';
};

/** The live-signal ticker contents (seeded once, fixed order). */
export const FEED: FeedEvent[] = [
  { cc: 'US', text: 'Spot ETH ETF inflows hit record', vol: 94, mom: 72, tone: 'red' },
  { cc: 'CN', text: 'PBOC unexpectedly cuts RRR by 25bps', vol: 91, mom: 81, tone: 'red' },
  { cc: 'TR', text: 'CBRT surprise 250bps hike to 50%', vol: 76, mom: 71, tone: 'amber' },
  { cc: 'IN', text: 'RBI digital rupee pilot expands', vol: 70, mom: 44, tone: 'cyan' },
  { cc: 'JP', text: 'BoJ YCC tweak leaked to press', vol: 68, mom: 54, tone: 'amber' },
  { cc: 'KR', text: 'Won hits 16-month low vs USD', vol: 64, mom: 33, tone: 'cyan' },
  { cc: 'BR', text: 'Real rallies on Selic surprise', vol: 60, mom: 28, tone: 'cyan' },
  { cc: 'DE', text: 'Bund yields spike on CPI beat', vol: 57, mom: 19, tone: 'cyan' },
  { cc: 'SA', text: 'Aramco megadeal chatter builds', vol: 55, mom: 22, tone: 'cyan' },
  { cc: 'GB', text: 'Gilt auction tails, sterling slips', vol: 52, mom: 17, tone: 'cyan' },
];

/** Deterministic beacon spawn order for the ~12s "somewhere new" pop. */
export function spawnOrder(count: number): number[] {
  const rand = mulberry32(1337);
  const idx = Array.from({ length: count }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
