'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Backside sphere that paints the empty space around the planet. A barely-
 * perceptible vertical gradient — almost pure black at the bottom, the
 * faintest hint of navy near the top. Adds depth to the void without
 * pulling focus from the planet.
 */
export default function SpaceGradient() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);

          // Barely-perceptible vertical gradient — top a hair lighter
          float verticalGrad = 0.5 + dir.y * 0.3;

          vec3 deepSpace = vec3(0.002, 0.005, 0.015);
          vec3 navyTint = vec3(0.02, 0.04, 0.10);

          vec3 finalColor = mix(deepSpace, navyTint, verticalGrad * 0.4);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={[400, 400, 400]} renderOrder={-1000}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
