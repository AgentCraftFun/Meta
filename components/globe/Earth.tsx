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

    // Smoother, narrower terminator transition
    float dayMix = smoothstep(-0.15, 0.25, cosAngle);

    // City lights — sodium-vapor warmth, kept strong
    vec3 cityLights = nightColor * 2.5;
    cityLights.r *= 1.1;
    cityLights.g *= 0.95;
    cityLights.b *= 0.7;

    vec3 color = mix(cityLights, dayColor, dayMix);

    // Sun glint ONLY on oceans — land never speculars
    float oceanMask = step(0.5, specMask);
    float specBoost = pow(max(0.0, cosAngle), 8.0) * oceanMask * 0.3;
    color += vec3(specBoost);

    // Subtle warm rim — Gaussian peak right at the terminator edge, not a
    // wide band. exp(-x^2) makes a narrow lobe centered at cosAngle=0.
    float terminatorEdge = exp(-pow(cosAngle * 8.0, 2.0)) * 0.15;
    vec3 warmRim = vec3(1.0, 0.6, 0.4) * terminatorEdge;
    color += warmRim;

    // Cool atmospheric scattering on the day side limb (Rayleigh tint near
    // the silhouette edge — gives the "earth from space" feel without
    // painting bands).
    float fresnel = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    vec3 atmosphericTint =
      vec3(0.4, 0.6, 1.0) * pow(fresnel, 3.0) * dayMix * 0.2;
    color += atmosphericTint;

    // 15% saturation boost — rich documentary look without going cartoony
    vec3 luma = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(luma, color, 1.15);

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
