'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Soft halo atmosphere. Backside sphere at 1.15 radius with a wide-falloff
 * Fresnel that bleeds into space rather than reading as a hard rim line.
 */
export default function Atmosphere() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          // Wider, softer falloff — key to a halo instead of a ring.
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
          gl_FragColor = vec4(atmosphereColor, 1.0) * intensity;
        }
      `,
    });
  }, []);

  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
