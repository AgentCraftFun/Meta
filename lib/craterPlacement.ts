import * as THREE from 'three';
import type { MoonFilter } from './moonFlags';
import { hashString } from './tokenActivity';
import type { HeatLevel, Token } from './types/token';

/**
 * HDR heat colours — components > 1.0 trigger bloom on the additively-
 * blended crater rings, disks, and shafts. Strict 3-tier red / amber /
 * white only.
 */
export const HEAT_HDR: Record<HeatLevel, [number, number, number]> = {
  hot: [2.5, 0.4, 0.2],
  warm: [2.2, 1.4, 0.2],
  emerging: [1.4, 1.5, 1.8],
};

// Re-export the THREE-free helpers so existing imports keep working.
export { computeActivity, hashString } from './tokenActivity';

/**
 * Place a token on the moon's local unit sphere by age.
 *
 *   age <  1h   → tight cluster near the camera-facing "front pole"
 *   age <  6h   → ring just outside that cluster
 *   age < 24h   → wider equatorial spread
 *   age ≥ 24h   → drift toward the opposite pole
 *
 * Azimuth is deterministic from the token symbol so the crater stays put
 * across reloads. Polar angle gets a token-stable jitter so tokens within
 * the same age bucket don't pile on top of each other.
 *
 * Filter-driven hemisphere split: the moon's lit hemisphere faces +X (key
 * directional light at [5,2,3]); the shadowed hemisphere faces -X. When
 * filter='losers' the X coordinate is mirrored so losing tokens appear on
 * the dim side of the visible disk — the metaphor lives in placement, not
 * lighting. Lighting is identical for every filter.
 */
export function getCraterPosition(token: Token, filter?: MoonFilter): THREE.Vector3 {
  const ageHours = token.age;
  const symbolHash = hashString(token.symbol);
  /** Stable [0, 1) value derived from the symbol — used for jitter. */
  const jitter = ((symbolHash * 13) % 1000) / 1000;

  let polarAngle: number;
  if (ageHours < 1) {
    polarAngle = THREE.MathUtils.lerp(0.0, 0.4, jitter);
  } else if (ageHours < 6) {
    const t = (ageHours - 1) / 5;
    polarAngle = THREE.MathUtils.lerp(0.4, 1.0, THREE.MathUtils.lerp(t, jitter, 0.3));
  } else if (ageHours < 24) {
    const t = (ageHours - 6) / 18;
    polarAngle = THREE.MathUtils.lerp(1.0, 2.0, THREE.MathUtils.lerp(t, jitter, 0.3));
  } else {
    const t = Math.min(1, (ageHours - 24) / 48);
    polarAngle = THREE.MathUtils.lerp(2.0, Math.PI, THREE.MathUtils.lerp(t, jitter, 0.2));
  }

  const azimuth = ((symbolHash % 1000) / 1000) * Math.PI * 2;

  const radius = 1.0;
  const x = radius * Math.sin(polarAngle) * Math.cos(azimuth);
  const y = radius * Math.sin(polarAngle) * Math.sin(azimuth);
  const z = radius * Math.cos(polarAngle);

  // Mirror lateral X for losers → dark hemisphere on the visible disk.
  const facingX = filter === 'losers' ? -1 : 1;
  return new THREE.Vector3(x * facingX, y, z);
}

/**
 * Quaternion that aligns local +Y with the surface normal at a position
 * on the unit sphere — used to lay craters and stand light shafts
 * perpendicular to the moon at every point.
 */
const Y_AXIS = new THREE.Vector3(0, 1, 0);
export function alignToNormal(positionOnUnitSphere: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    Y_AXIS,
    positionOnUnitSphere.clone().normalize()
  );
}
