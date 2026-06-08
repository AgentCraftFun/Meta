'use client';

import { useMemo } from 'react';
import CelestialBody, {
  type CelestialShader,
} from '@/components/celestial/CelestialBody';
import { SUN_DIRECTION } from '@/lib/sun';
import type { TextureTier } from './deviceTier';

/**
 * /siteNEW Earth. Reuses the READ-ONLY <CelestialBody> primitive and shared
 * SUN_DIRECTION, but loads the device-tiered optimized WebP textures
 * (public/textures/sitenew/*) instead of the original 8k JPGs — the read-only
 * components/earth/Earth.tsx hardcodes the 8k paths, so this thin fork is the
 * only way to control the texture tier without modifying shared code.
 *
 * The GLSL below is the same blue-graded day/night fragment as the product
 * Earth (shader source = asset data, intentionally duplicated, not imported
 * from the read-only component).
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
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

    // Lambert with deep shadow — EXACTLY /siteview's curve (the deep 0.15 floor
    // is what keeps the lit side crisp and high-contrast, not washed out).
    float lighting = mix(0.15, 1.3, smoothstep(-0.2, 0.5, cosAngle));
    vec3 dayLit = dayColor * lighting;

    float nightFactor = 1.0 - smoothstep(-0.3, 0.0, cosAngle);
    vec3 cityLights = nightColor * 0.6 * nightFactor;
    cityLights.r *= 1.0;
    cityLights.g *= 0.85;
    cityLights.b *= 0.6;

    vec3 color = dayLit + cityLights;

    vec3 blueGrade = color * vec3(0.75, 0.9, 1.15);
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    float gradeMix = 1.0 - smoothstep(0.3, 0.8, luma);
    color = mix(color, blueGrade, gradeMix * 0.7);

    // Cool ambient on the shadow side — EXACTLY /siteview (0.5).
    float shadowAmount = 1.0 - smoothstep(-0.3, 0.3, cosAngle);
    color = mix(color, color * vec3(0.4, 0.6, 0.95), shadowAmount * 0.5);

    float oceanMask = step(0.5, specMask);
    float specBoost = pow(max(0.0, cosAngle), 32.0) * oceanMask * 0.4;
    color += vec3(specBoost) * vec3(0.7, 0.85, 1.0);

    // Keep the night side + grazing limb clearly ABOVE the #05080F page bg so
    // the FULL disc — including the part hanging above the Vision card — reads
    // SOLID instead of fading into the backdrop. A deep-navy earth-shine floor;
    // only lifts fragments already near black, the lit hemisphere is untouched.
    // (Verified headlessly: the top cap separates from the bg at ~rgb(26,39,43)
    // vs the page's rgb(6,9,16); the weaker prior floor still read see-through.)
    color = max(color, vec3(0.055, 0.08, 0.155));
    color = min(color, vec3(1.05));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function SceneEarth({ tier }: { tier: TextureTier }) {
  const textures = useMemo(
    () => ({
      day: `/textures/sitenew/earth_day_${tier}.webp`,
      night: `/textures/sitenew/earth_night_${tier}.webp`,
      specular: `/textures/sitenew/earth_specular_${tier}.webp`,
    }),
    [tier]
  );

  const shader: CelestialShader = useMemo(
    () => ({
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        sunDirection: { value: SUN_DIRECTION.clone() },
      },
    }),
    []
  );

  return (
    <CelestialBody
      textures={textures}
      material="shader"
      shader={shader}
      radius={1}
      segments={128}
    />
  );
}
