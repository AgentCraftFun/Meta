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
    // A standard fresnel ( pow(1 - abs(dot), N) ) on a backside shell puts
    // the peak right AT the shell's own silhouette — that reads as a hard
    // boundary ring against deep space. Invert the polarity so the peak
    // sits at the INNER edge of the visible annulus (touching the moon's
    // own silhouette) and decays to ~zero at the shell silhouette. The
    // halo dissolves smoothly into space; only the moon's body provides
    // an "edge", which is what we want.
    float depth = abs(dot(vNormal, vViewDir));
    float halo = pow(depth, 2.5);

    vec3 color = vec3(0.35, 0.55, 0.85);
    float alpha = halo * 0.55;

    gl_FragColor = vec4(color * halo, alpha);
  }
`;

/**
 * Soft cool-blue atmospheric scatter around the moon. BackSide additive
 * sphere at radius 1.10 so the visible halo annulus has ~10% of moon
 * radius worth of falloff room. The shader peaks at the moon's
 * silhouette and fades to ~0 at the shell silhouette, which is the only
 * way fresnel-on-shell stops producing a discrete ring band.
 */
export default function MoonAtmosphericGlow() {
  return (
    <mesh>
      <sphereGeometry args={[1.1, 64, 64]} />
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
