import * as THREE from 'three';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Rank-based polar placement on the moon's surface. Top-ranked tokens
 * cluster at the "north pole" (+Y), the rest spiral outward via a golden-
 * angle azimuth. The default camera is positioned slightly above the
 * pole, so the highest-ranked flags are visible immediately and the user
 * rotates the moon to discover the rest.
 *
 * Lives separately from lib/moonFlags.ts so that TokenList (a static
 * page-bundle import) doesn't drag three.js into the non-canvas chunk.
 */
export function getFlagPosition(rank: number, total: number): THREE.Vector3 {
  const t = rank / Math.max(1, total);
  const polarAngle = Math.acos(1 - t * 1.6); // 0 → ~2.0 rad (front 80%)
  const azimuthAngle = rank * GOLDEN_ANGLE;

  const radius = 1.0;
  const x = radius * Math.sin(polarAngle) * Math.cos(azimuthAngle);
  const y = radius * Math.cos(polarAngle);
  const z = radius * Math.sin(polarAngle) * Math.sin(azimuthAngle);
  return new THREE.Vector3(x, y, z);
}

/**
 * Quaternion that aligns local +Y with the surface normal at the given
 * unit-sphere position. Used to stand a flag's pole perpendicular to the
 * moon at every point.
 */
const Y_AXIS = new THREE.Vector3(0, 1, 0);
export function alignToNormal(positionOnUnitSphere: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    Y_AXIS,
    positionOnUnitSphere.clone().normalize()
  );
}
