'use client';

import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SUN_DIRECTION } from '@/lib/sun';

const TEXTURES = {
  day: '/textures/8k_earth_daymap.jpg',
  specular: '/textures/8k_earth_specular_map.png',
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    // World-space normal so the static sunDirection lines up.
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 surfaceColor = texture2D(dayTexture, vUv).rgb;
    float specMask = texture2D(specularMap, vUv).r;

    float cosAngle = dot(normalize(vNormal), normalize(sunDirection));

    // 0.25 floor keeps the unlit side readable for markers.
    float lighting = mix(0.25, 1.4, smoothstep(-0.3, 0.6, cosAngle));

    vec3 color = surfaceColor * lighting;

    // Cool atmospheric scattering on the shadow side — never pure dark.
    float shadowAmount = 1.0 - smoothstep(-0.3, 0.3, cosAngle);
    color = mix(color, color * vec3(0.5, 0.7, 1.0), shadowAmount * 0.4);

    // Sun glint ONLY on water and only at tight angles.
    float oceanMask = step(0.5, specMask);
    float specBoost = pow(max(0.0, cosAngle), 24.0) * oceanMask * 0.5;
    color += vec3(specBoost);

    // Prevent runaway brightness on snow/ice that triggers bloom blowout.
    color = min(color, vec3(1.05));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  const [dayMap, specMap] = useTexture([TEXTURES.day, TEXTURES.specular]);

  dayMap.colorSpace = THREE.SRGBColorSpace;
  specMap.colorSpace = THREE.NoColorSpace;
  dayMap.anisotropy = 8;
  specMap.anisotropy = 4;

  // Sun is static — calculate once, no per-frame uniform sync needed.
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayMap },
        specularMap: { value: specMap },
        sunDirection: { value: SUN_DIRECTION.clone() },
      },
      vertexShader,
      fragmentShader,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayMap, specMap]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
