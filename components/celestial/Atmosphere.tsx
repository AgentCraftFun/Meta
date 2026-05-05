'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

type Props = {
  /** vec3 colour of the rim halo. Defaults to Earth's cyan-blue. */
  color?: [number, number, number];
  /** Multiplier on output. Higher = brighter rim. */
  intensity?: number;
  /** Sphere scale relative to the body radius. Default 1.02. */
  scale?: number;
  /** Falloff exponent. Higher = tighter rim. */
  power?: number;
  /** Threshold inside the falloff curve. Default 0.72 (matches Earth). */
  threshold?: number;
};

/**
 * Generic Fresnel atmosphere — backside sphere with an additive cyan rim
 * that hugs the silhouette. All parameters are tunable so different bodies
 * can carry different atmospheres (or skip the component entirely).
 *
 * The defaults are Earth's exact current values, so callers that pass no
 * props produce the unchanged Earth halo.
 */
export default function Atmosphere({
  color = [0.35, 0.65, 1.0],
  intensity = 2.0,
  scale = 1.02,
  power = 5,
  threshold = 0.72,
}: Props) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Vector3(...color) },
        uIntensity: { value: intensity },
        uPower: { value: power },
        uThreshold: { value: threshold },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uPower;
        uniform float uThreshold;
        varying vec3 vNormal;
        void main() {
          float fresnel = pow(uThreshold - dot(vNormal, vec3(0.0, 0.0, 1.0)), uPower);
          gl_FragColor = vec4(uColor, 1.0) * fresnel * uIntensity;
        }
      `,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <mesh scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
