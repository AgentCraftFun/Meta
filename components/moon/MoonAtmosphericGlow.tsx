'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // Inverted Fresnel since we're rendering BackSide — the rim faces the
    // viewer when the dot product is small.
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    float intensity = pow(fresnel, 3.5) * 0.4;
    vec3 glow = vec3(0.45, 0.55, 0.75);
    gl_FragColor = vec4(glow * intensity, intensity);
  }
`;

type Props = {
  /** Glow shell radius. Should be slightly larger than the moon body. */
  radius?: number;
  segments?: number;
};

/**
 * Soft Fresnel halo around the moon — adds atmospheric rim light at the
 * silhouette so the terminator doesn't read as a hard knife edge against
 * deep space. Rendered BackSide on a slightly oversized sphere with
 * additive blending so it lifts the rim without darkening the body.
 */
export default function MoonAtmosphericGlow({
  radius = 1.015,
  segments = 96,
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
