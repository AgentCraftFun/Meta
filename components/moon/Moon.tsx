'use client';

import CelestialBody from '@/components/celestial/CelestialBody';

const MOON_TEXTURE = '/textures/8k_moon.jpg';

/**
 * Hyperrealistic 3D moon: NASA equirectangular albedo doubling as a bump
 * map for free crater depth, very rough material (the moon is dusty,
 * non-metallic), slow Y-axis rotation. No atmosphere, no day/night blend
 * — the silhouette against deep space is the look.
 */
export default function Moon() {
  return (
    <CelestialBody
      textures={{ day: MOON_TEXTURE }}
      material="standard"
      radius={1}
      segments={128}
      rotationSpeed={0.008}
      standardProps={{
        roughness: 0.95,
        metalness: 0.0,
        useBumpFromDay: true,
        bumpScale: 0.02,
      }}
    />
  );
}
