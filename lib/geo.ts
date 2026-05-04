import * as THREE from 'three';

/**
 * Convert lat/lng (degrees) to a 3D position on a sphere of given radius.
 *
 * Uses the standard equirectangular convention where:
 *  - lat 0 / lng 0 (Gulf of Guinea) maps to roughly +X
 *  - lat 90 (north pole) maps to +Y
 *  - the prime meridian seam is on the back of the sphere
 *
 * Matches the orientation used by the NASA blue-marble day texture.
 */
export function latLngToVec3(
  lat: number,
  lng: number,
  radius = 1
): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

/**
 * Quaternion that rotates the local +Y axis to align with the outward
 * surface normal at the given lat/lng. Useful for orienting a vertical pin
 * so it sticks straight out from the surface.
 */
export function surfaceQuaternion(lat: number, lng: number): THREE.Quaternion {
  const normal = latLngToVec3(lat, lng, 1);
  return new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal
  );
}
