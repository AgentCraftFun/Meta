'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Cinematic Fresnel atmosphere — back-side sphere slightly larger than earth,
 * additive cyan-white glow strongest at silhouette edge.
 */
export default function Atmosphere() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColorInner: { value: new THREE.Color('#9ee9ff') },
        uColorOuter: { value: new THREE.Color('#1f6dff') },
        uPower: { value: 3.2 },
        uIntensity: { value: 1.55 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vPositionW = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        uniform vec3 uColorInner;
        uniform vec3 uColorOuter;
        uniform float uPower;
        uniform float uIntensity;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          // back-side: invert normal for fresnel at silhouette
          float rim = pow(1.0 - abs(dot(viewDir, normalize(vNormalW))), uPower);
          vec3 col = mix(uColorOuter, uColorInner, smoothstep(0.0, 1.0, rim));
          float alpha = clamp(rim * uIntensity, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={1.085}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
