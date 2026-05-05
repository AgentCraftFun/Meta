'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    // w=0 strips translation; world-space normal accounts for any rotation
    // applied by parent groups so the sun-alignment dot product stays
    // correct as the moon spins.
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  uniform vec3 uSunDirection;

  void main() {
    // Silhouette mask — concentrates the glow at the rim, dies quickly
    // toward the centre of the projected disc.
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    float silhouette = pow(fresnel, 4.0);

    // Sun alignment: +1 = facing sun, 0 = terminator, -1 = facing away.
    float sunFacing = dot(vWorldNormal, uSunDirection);

    // Brightness multiplier: bright on the lit rim, medium at the
    // terminator, near-zero on the shadow rim.
    float sunlitMult = smoothstep(-0.4, 0.7, sunFacing);
    float rimBrightness = mix(0.15, 1.4, sunlitMult);

    // Colour gradient mirrors how light scatters through atmosphere:
    //   sun-facing  → cool white with a touch of blue
    //   terminator  → cyan-blue
    //   shadow      → deep navy (almost invisible)
    vec3 hotColor  = vec3(0.85, 0.92, 1.05);
    vec3 termColor = vec3(0.45, 0.60, 0.85);
    vec3 coldColor = vec3(0.08, 0.12, 0.25);

    vec3 rimColor;
    if (sunFacing > 0.0) {
      rimColor = mix(termColor, hotColor, smoothstep(0.0, 0.7, sunFacing));
    } else {
      rimColor = mix(coldColor, termColor, smoothstep(-0.7, 0.0, sunFacing));
    }

    float intensity = silhouette * rimBrightness;
    float alpha = intensity * 0.55;

    gl_FragColor = vec4(rimColor * rimBrightness, alpha);
  }
`;

type Props = {
  /** Glow shell radius. Wider radius = more falloff room into space. */
  radius?: number;
  segments?: number;
};

/**
 * Directional, asymmetric atmospheric scatter around the moon. The
 * sun-facing silhouette gets a bright cool-white halo, the terminator
 * shifts to cyan-blue, and the shadow rim fades to deep navy — like
 * light refracting through a real atmosphere instead of a uniform
 * sticker outline. uSunDirection is locked to the key directional
 * light's world direction (5, 2, 3) so the gradient stays anchored
 * to the actual lighting setup as the moon rotates.
 */
export default function MoonAtmosphericGlow({
  radius = 1.06,
  segments = 96,
}: Props) {
  const material = useMemo(() => {
    const sunDirection = new THREE.Vector3(5, 2, 3).normalize();
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uSunDirection: { value: sunDirection },
      },
    });
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[radius, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
