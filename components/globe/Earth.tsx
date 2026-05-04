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
    // World-space normal so sunDirection (world-space) lines up.
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

    // Wide, soft terminator so the day/night transition reads like a band,
    // not a line.
    float dayMix = smoothstep(-0.25, 0.35, cosAngle);

    // Twilight scattering band — peaks right at the boundary and falls off
    // on both sides, painting warm sunset colors across the terminator.
    float twilight =
      smoothstep(-0.3, 0.0, cosAngle) *
      (1.0 - smoothstep(0.0, 0.4, cosAngle));
    vec3 twilightColor = vec3(1.0, 0.5, 0.3);

    // City lights — boosted with sodium-vapor warmth so they survive bloom
    // and tone mapping.
    vec3 cityLights = nightColor * 2.5;
    cityLights.r *= 1.1;
    cityLights.g *= 0.95;
    cityLights.b *= 0.7;

    vec3 color = mix(cityLights, dayColor, dayMix);

    // Warm twilight glow at the terminator.
    color += twilightColor * twilight * 0.25;

    // Cool color grade on day side.
    color = mix(color, color * vec3(0.85, 0.95, 1.1), 0.3 * dayMix);

    // Sun glint ONLY on oceans (specMask high). Land never speculars,
    // so the Sahara, snow, and deserts stop blowing out under bloom.
    float oceanMask = step(0.5, specMask);
    float specBoost = pow(max(0.0, cosAngle), 8.0) * oceanMask * 0.3;
    color += vec3(specBoost);

    // Dim bright land slightly to prevent blowout under bloom.
    color = mix(color, color * 0.85, dayMix * 0.5);

    // Filmic crush.
    color *= 0.85;

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
