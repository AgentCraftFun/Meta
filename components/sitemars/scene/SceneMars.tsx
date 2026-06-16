'use client';

import { useMemo } from 'react';
import CelestialBody, {
  type CelestialShader,
} from '@/components/celestial/CelestialBody';
import { SUN_DIRECTION } from '@/lib/sun';

/**
 * /siteMARS planet — a Mars fork of components/sitenew/scene/SceneEarth.tsx.
 *
 * Same READ-ONLY <CelestialBody> primitive, same shared SUN_DIRECTION, and the
 * EXACT same Lambert lighting curve as the /siteNEW Earth, so Mars sits in the
 * scene with identical framing, brightness and terminator placement — the only
 * thing that changes is the surface. It loads the single high-quality 8k Mars
 * texture (public/textures/8k_mars.jpg) the user supplied, and drops every
 * Earth-only term that would look wrong on Mars: no city night-lights, no ocean
 * specular highlight, and no cyan blue-grade. The shadow side carries a faint
 * warm (dusty) tint instead of Earth's cool blue so the dark limb still reads
 * as the red planet rather than crushing to black.
 */

const MARS_TEXTURE = '/textures/8k_mars.jpg';

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
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 surface = texture2D(dayTexture, vUv).rgb;

    float cosAngle = dot(normalize(vNormal), normalize(sunDirection));

    // EXACTLY the /siteNEW Earth Lambert curve (deep 0.15 floor → crisp,
    // high-contrast lit side) so Mars reads at the same brightness and the
    // terminator lands in the same place as the Earth it replaces.
    float lighting = mix(0.15, 1.3, smoothstep(-0.2, 0.5, cosAngle));
    vec3 color = surface * lighting;

    // Warm, dusty shadow side. The Earth shader tinted this cool blue (oceans /
    // city lights); Mars has neither, so the dark side keeps a faint rust tone
    // instead — a believable night limb, not a blue cast.
    float shadowAmount = 1.0 - smoothstep(-0.3, 0.3, cosAngle);
    color = mix(color, color * vec3(0.55, 0.40, 0.34), shadowAmount * 0.5);

    color = min(color, vec3(1.05));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function SceneMars() {
  const textures = useMemo(() => ({ day: MARS_TEXTURE }), []);

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
