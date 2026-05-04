'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SUN_DIRECTION } from '@/lib/sun';

const TEXTURES = {
  day: '/textures/8k_earth_daymap.jpg',
  night: '/textures/8k_earth_nightmap.jpg',
  specular: '/textures/8k_earth_specular_map.png',
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    // World-space normal so sunDirection (a world-space vector) lines up.
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    float specMask = texture2D(specularMap, vUv).r;

    float cosAngle = dot(normalize(vNormal), normalize(sunDirection));
    // Soft terminator. -0.15..0.25 hides the harsh shadow line.
    float dayMix = smoothstep(-0.15, 0.25, cosAngle);

    // Boost night side so city lights pop.
    vec3 color = mix(nightColor * 1.4, dayColor, dayMix);

    // Subtle ocean shine on day side only.
    float specBoost = specMask * max(0.0, cosAngle) * 0.3;
    color += vec3(specBoost);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  const [dayMap, nightMap, specMap] = useTexture([
    TEXTURES.day,
    TEXTURES.night,
    TEXTURES.specular,
  ]);

  // Color textures need sRGB; specular is data, leave it linear.
  dayMap.colorSpace = THREE.SRGBColorSpace;
  nightMap.colorSpace = THREE.SRGBColorSpace;
  specMap.colorSpace = THREE.NoColorSpace;
  dayMap.anisotropy = 8;
  nightMap.anisotropy = 8;
  specMap.anisotropy = 4;

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        specularMap: { value: specMap },
        sunDirection: { value: SUN_DIRECTION.clone() },
      },
      vertexShader,
      fragmentShader,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayMap, nightMap, specMap]);

  // The earth group rotates on its own axis (auto-rotate), but the sun stays
  // fixed in world space. The world-space vNormal in the vertex shader handles
  // that already; nothing to do per-frame except keep the uniform alive.
  useFrame(() => {
    material.uniforms.sunDirection.value.copy(SUN_DIRECTION);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
