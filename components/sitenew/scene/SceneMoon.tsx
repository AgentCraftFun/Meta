'use client';

import CelestialBody from '@/components/celestial/CelestialBody';

/**
 * /siteNEW moon. A thin fork of components/moon/Moon.tsx that loads the
 * device-light optimized texture (public/textures/sitenew/moon_2k.webp, ~0.5MB)
 * instead of the read-only /moon route's 15MB 8k JPG — the Vision card moon is
 * small, so 2k is plenty. Same dusty, non-metallic standard material + albedo
 * doubling as a bump map for free crater depth.
 */

const MOON_TEXTURE = '/textures/sitenew/moon_2k.webp';

export default function SceneMoon({ rotationSpeed = 0.04 }: { rotationSpeed?: number }) {
  return (
    <CelestialBody
      textures={{ day: MOON_TEXTURE }}
      material="standard"
      radius={1}
      segments={96}
      rotationSpeed={rotationSpeed}
      standardProps={{
        roughness: 0.92,
        metalness: 0.0,
        useBumpFromDay: true,
        bumpScale: 0.022,
        // Lifted baseline glow so the shadow side stays a SOLID grey moon
        // rather than crushing to near-black and blending into the page bg.
        emissive: '#6b7488',
        emissiveIntensity: 0.3,
      }}
    />
  );
}
