'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Procedural nebula on the inside of a giant sphere. Renders far behind
 * everything else so it acts as the actual background. Soft layered noise
 * paints subtle blue/purple cloudy variation; never overpowering, just
 * enough to give space depth and color.
 */
export default function NebulaBackground() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
      },
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

        float hash(vec3 p) {
          p = fract(p * vec3(443.8975, 397.2973, 491.1871));
          p += dot(p, p.yxz + 19.19);
          return fract((p.x + p.y) * p.z);
        }

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
            mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
            f.z
          );
        }

        // Fractal brownian motion for fine wispy detail across multiple octaves
        float fbm(vec3 p) {
          float total = 0.0;
          float amplitude = 1.0;
          float frequency = 1.0;
          for (int i = 0; i < 5; i++) {
            total += noise(p * frequency) * amplitude;
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return total;
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);

          // High-frequency wispy nebula, not big blobs
          float nebula = fbm(dir * 8.0);
          nebula = smoothstep(0.45, 0.85, nebula);

          float colorMix = noise(dir * 1.5);
          vec3 color1 = vec3(0.08, 0.04, 0.18); // deeper purple
          vec3 color2 = vec3(0.03, 0.08, 0.20); // deeper blue
          vec3 nebulaColor = mix(color1, color2, colorMix);

          // Pure deep space base
          vec3 spaceColor = vec3(0.005, 0.008, 0.02);

          // Much more subtle — was 0.6, now 0.25
          vec3 finalColor = spaceColor + nebulaColor * nebula * 0.25;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={[500, 500, 500]} renderOrder={-1000}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
