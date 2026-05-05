'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Backside sphere that paints the empty space around the planet. A barely-
 * perceptible vertical gradient — almost pure black at the bottom, the
 * faintest hint of navy near the top. Adds depth to the void without
 * pulling focus from the planet.
 *
 * The gradient itself only spans a few 8-bit steps (RGB ~1,2,6 → ~2,4,11),
 * so the smooth transition gets stair-stepped into visible horizontal
 * bands by framebuffer quantization. We dither with a cheap interleaved-
 * gradient-noise hash at ±1/255 magnitude — sub-perceptible on its own,
 * but enough to break the round-to-nearest-byte boundaries into a smooth
 * fade.
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

        // Interleaved Gradient Noise — Jorge Jimenez. Cheap screen-space
        // pseudo-random in [0, 1) from gl_FragCoord.
        float ign(vec2 p) {
          return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);

          // Barely-perceptible vertical gradient — top a hair lighter
          float verticalGrad = 0.5 + dir.y * 0.3;

          vec3 deepSpace = vec3(0.002, 0.005, 0.015);
          vec3 navyTint = vec3(0.02, 0.04, 0.10);

          vec3 finalColor = mix(deepSpace, navyTint, verticalGrad * 0.4);

          // Triangle-noise dither (TPDF) at one 8-bit LSB. Two IGN samples
          // subtracted give ±1/255 with a uniform-ish distribution, enough
          // to break the banding contours below the visible threshold.
          float n1 = ign(gl_FragCoord.xy);
          float n2 = ign(gl_FragCoord.xy + vec2(11.0, 17.0));
          float dither = (n1 - n2) / 255.0;
          finalColor += vec3(dither);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={[400, 400, 400]} renderOrder={-1000}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
