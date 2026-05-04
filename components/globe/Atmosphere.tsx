'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const innerVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Inner rim — tight, bright Fresnel glow hugging the silhouette.
 */
function makeInnerMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader: innerVertex,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.85 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 8.0);
        gl_FragColor = vec4(0.4, 0.7, 1.0, 1.0) * intensity * 1.5;
      }
    `,
  });
}

/**
 * Outer glow — wide, soft falloff that bleeds into space.
 */
function makeOuterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader: innerVertex,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(0.3, 0.55, 1.0, 1.0) * intensity * 0.5;
      }
    `,
  });
}

export default function Atmosphere() {
  const innerMat = useMemo(makeInnerMaterial, []);
  const outerMat = useMemo(makeOuterMaterial, []);
  return (
    <>
      <mesh scale={1.015}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={innerMat} attach="material" />
      </mesh>
      <mesh scale={1.25}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={outerMat} attach="material" />
      </mesh>
    </>
  );
}
