'use client';

import * as THREE from 'three';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    float halo = pow(fresnel, 3.0);

    vec3 color = vec3(0.35, 0.55, 0.85);
    float alpha = halo * 0.45;

    gl_FragColor = vec4(color * halo, alpha);
  }
`;

/**
 * Minimal cool-blue rim glow around the moon. BackSide additive sphere
 * just outside the moon surface (radius 1.04) — no asymmetry, no HDR,
 * no sun-direction logic. Bloom is reserved for craters.
 */
export default function MoonAtmosphericGlow() {
  return (
    <mesh>
      <sphereGeometry args={[1.04, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
