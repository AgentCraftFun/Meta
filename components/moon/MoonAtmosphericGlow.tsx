'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 uSunDirection;
  varying vec3 vNormalWorld;
  varying vec3 vViewDir;

  void main() {
    // BackSide rendering: at the silhouette the back-face normal is
    // perpendicular to the view direction, so abs(dot) → 0 there. Inverting
    // and raising to a soft power gives a wide halo that's strongest at
    // the rim and dies gradually inward.
    float fresnel = abs(dot(vNormalWorld, vViewDir));
    float halo = pow(1.0 - fresnel, 2.5);

    // Sun alignment in world space. The halo sphere lives inside the
    // rotating moon group; modelMatrix carries the rotation, but the
    // sun direction is a fixed world vector — so as the moon spins, the
    // bright/dark sides stay locked to the actual key-light direction.
    float sunDot = dot(normalize(vNormalWorld), normalize(uSunDirection));
    float sunSide = smoothstep(-0.3, 0.6, sunDot);

    vec3 shadowColor = vec3(0.05, 0.10, 0.25);
    vec3 terminColor = vec3(0.25, 0.45, 0.70);
    vec3 sunColor    = vec3(0.85, 0.95, 1.20);

    vec3 color;
    if (sunSide < 0.5) {
      color = mix(shadowColor, terminColor, sunSide * 2.0);
    } else {
      color = mix(terminColor, sunColor, (sunSide - 0.5) * 2.0);
    }

    float alpha = halo * 0.85;
    gl_FragColor = vec4(color * halo, alpha);
  }
`;

interface Props {
  /** World-space direction of the key directional light. Defaults to the
   *  Moon scene's [5, 2, 3] sun position. The vector is normalized inside
   *  the component, so passing the unnormalized light position is fine. */
  sunDirection?: [number, number, number];
}

/**
 * Wide directional atmospheric scatter around the moon. A backside-rendered
 * sphere at radius 1.18 with additive blending paints a soft halo that
 * extends ~18% of the moon's radius into space. The shader gates colour
 * against the sun direction so the halo asymmetrically grades from cool
 * white (sun rim) → cyan-blue (terminator) → deep navy (shadow rim).
 *
 * No depth write — the moon body still occludes the halo correctly via
 * depth test, so the halo only shows beyond the silhouette.
 */
export default function MoonAtmosphericGlow({
  sunDirection = [5, 2, 3],
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uSunDirection: {
        value: new THREE.Vector3(...sunDirection).normalize(),
      },
    }),
    [sunDirection]
  );

  return (
    <mesh ref={meshRef} scale={1}>
      <sphereGeometry args={[1.18, 96, 96]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
