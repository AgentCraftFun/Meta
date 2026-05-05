import type { HeatLevel, Token } from './types/token';

/**
 * Tiny deterministic hash. Used to derive each token's orbital inclination
 * and phase from its symbol so the satellite "lives" in the same orbital
 * slot across reloads.
 */
export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export type OrbitParams = {
  /** Distance from origin (the moon's centre) in scene units. */
  radius: number;
  /** Angular velocity in rad/s. */
  speed: number;
  /** Tilt of the orbital plane in radians. */
  inclination: number;
  /** Starting phase along the orbit in radians. */
  phase: number;
  /** Satellite mesh scale multiplier. */
  size: number;
};

/**
 * Map a token to a deterministic orbital slot. Bigger market cap orbits
 * closer; bigger volume orbits faster. Inclination + phase come from the
 * symbol hash so identical tokens always land in identical orbits.
 */
export function getOrbitParams(token: Token): OrbitParams {
  const logCap = Math.log10(Math.max(token.marketCap, 1000)); // 3..12
  const radius = 4.5 - ((logCap - 3) / 9) * 2.9; // 4.5 (small) -> 1.6 (huge)

  const logVol = Math.log10(Math.max(token.volume24h, 1000));
  const speed = 0.05 + ((logVol - 3) / 7) * 0.35;

  const h = hashString(token.symbol);
  const inclination = ((h % 1000) / 1000) * Math.PI - Math.PI / 2;
  const phase = (((h * 7) % 1000) / 1000) * Math.PI * 2;

  const size = 0.012 + ((logCap - 3) / 9) * 0.018;

  return { radius, speed, inclination, phase, size };
}

/**
 * Given orbit params and elapsed time, compute the satellite's position in
 * world space. Used both for setting instance matrices and for anchoring
 * the hover card / selection ring to a moving satellite.
 */
export function orbitPosition(
  out: { x: number; y: number; z: number },
  params: OrbitParams,
  t: number
): void {
  const { radius, speed, inclination, phase } = params;
  const angle = t * speed + phase;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const sinI = Math.sin(inclination);
  const cosI = Math.cos(inclination);
  out.x = radius * cos;
  out.y = radius * sin * sinI;
  out.z = radius * sin * cosI;
}

/**
 * HDR colour per heat tier. Components > 1.0 are intentional — they push
 * past the bloom luminance threshold so satellites glow.
 */
export const HEAT_COLORS: Record<HeatLevel, [number, number, number]> = {
  hot: [1.5, 0.25, 0.18],
  warm: [1.4, 1.0, 0.15],
  emerging: [1.1, 1.1, 1.3],
};
