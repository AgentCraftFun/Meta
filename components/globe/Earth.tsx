'use client';

import { useTexture } from '@react-three/drei';
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

    // Lambert with deep shadow
    float lighting = mix(0.15, 1.3, smoothstep(-0.2, 0.5, cosAngle));
    vec3 dayLit = dayColor * lighting;

    // Subtle city lights — only on the genuinely dark side, dimmed so they
    // don't compete with the markers.
    float nightFactor = 1.0 - smoothstep(-0.3, 0.0, cosAngle);
    vec3 cityLights = nightColor * 0.6 * nightFactor;
    cityLights.r *= 1.0;
    cityLights.g *= 0.85;
    cityLights.b *= 0.6;

    vec3 color = dayLit + cityLights;

    // Monochromatic blue grade — the signature of the new look. Push toward
    // cool blue, leaving bright highlights closer to original.
    vec3 blueGrade = color * vec3(0.75, 0.9, 1.15);
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    float gradeMix = 1.0 - smoothstep(0.3, 0.8, luma);
    color = mix(color, blueGrade, gradeMix * 0.7);

    // Cool ambient on the shadow side.
    float shadowAmount = 1.0 - smoothstep(-0.3, 0.3, cosAngle);
    color = mix(color, color * vec3(0.4, 0.6, 0.95), shadowAmount * 0.5);

    // Tight ocean-only specular, tinted cool.
    float oceanMask = step(0.5, specMask);
    float specBoost = pow(max(0.0, cosAngle), 32.0) * oceanMask * 0.4;
    color += vec3(specBoost) * vec3(0.7, 0.85, 1.0);

    // Brightness clamp to prevent bloom blowout.
    color = min(color, vec3(1.05));

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

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
