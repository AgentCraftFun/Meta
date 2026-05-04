'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Single-layer cyan-white rim that hugs the silhouette and fades quickly to
 * space. One clean halo — the wider outer glow was making the planet feel
 * small.
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
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 5.0);
          vec3 rimColor = vec3(0.35, 0.65, 1.0);
          gl_FragColor = vec4(rimColor, 1.0) * intensity * 2.0;
        }
      `,
    });
  }, []);

  return (
    <mesh scale={1.02}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
