import * as THREE from 'three';

/**
 * Shared sun position used by both the directional light and the day/night
 * blending shader uniform. Keeping these in lockstep is what aligns the
 * specular highlight with the terminator.
 */
export const SUN_POSITION = new THREE.Vector3(5, 2, 3);
export const SUN_DIRECTION = SUN_POSITION.clone().normalize();
