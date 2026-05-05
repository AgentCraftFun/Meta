import type { Token } from './types/token';

/**
 * Combined activity score in [0, 1] — what the moon's crater size follows
 * (in place of market cap). A pumping memecoin can have a bigger crater
 * than BTC if it has more momentum + volume + recency.
 *
 *   momentum (0..1)  weighted 40%
 *   volume   (log-scaled 0..1)  weighted 40%
 *   recency  (1 if just-launched, 0 after 24h)  weighted 20%
 *
 * Lives in its own THREE-free module so consumers like TokenList can
 * import it without pulling three.js into the static page bundle.
 */
export function computeActivity(token: Token): number {
  const momentumScore = Math.max(0, Math.min(1, token.momentum));
  const volumeScore = Math.min(
    1,
    Math.log10(Math.max(1000, token.volume24h)) / 10
  );
  const recencyScore = Math.max(0, 1 - token.age / 24);
  return Math.min(
    1,
    momentumScore * 0.4 + volumeScore * 0.4 + recencyScore * 0.2
  );
}

/** Tiny deterministic FNV-style hash. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
