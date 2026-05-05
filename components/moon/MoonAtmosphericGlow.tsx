'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // Tighter falloff at silhouette, softer toward center — no hard band.
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    fresnel = pow(fresnel, 5.0);
    // Cool grayish-blue, low saturation — atmospheric scatter, not a glow.
    vec3 glowColor = vec3(0.55, 0.65, 0.80);
    gl_FragColor = vec4(glowColor, fresnel * 0.25);
  }
`;

type Props = {
  /** Glow shell radius. Slightly larger than the moon body so the falloff
   *  has room to fade gracefully into space. */
  radius?: number;
  segments?: number;
};

/**
 * Soft Fresnel halo around the moon — a barely-perceptible cool rim that
 * lifts the silhouette out of the void. Mirrors the look of Earth's
 * atmosphere: gentle, low-alpha, no banding. Rendered BackSide on a
 * slightly oversized sphere with additive blending so it tints the rim
 * without darkening the body.
 */
export default function MoonAtmosphericGlow({
  radius = 1.025,
  segments = 64,
}: Props) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
