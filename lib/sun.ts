import * as THREE from 'three';

/**
 * Shared sun position used by both the directional light and the day/night
 * blending shader uniform. Keeping these in lockstep is what aligns the
 * specular highlight with the terminator.
 */
export const SUN_POSITION = new THREE.Vector3(4, 3, 2);
export const SUN_DIRECTION = SUN_POSITION.clone().normalize();
