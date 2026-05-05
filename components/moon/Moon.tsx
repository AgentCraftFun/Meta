'use client';

import CelestialBody from '@/components/celestial/CelestialBody';

const MOON_TEXTURE = '/textures/8k_moon.jpg';

type Props = {
  /** Y-axis rotation rate. Default 0.005 rad/s. Pass 0 to defer rotation
   *  to a parent group. */
  rotationSpeed?: number;
};

/**
 * Hyperrealistic 3D moon: NASA equirectangular albedo doubling as a bump
 * map for free crater depth, very rough material (the moon is dusty,
 * non-metallic). No atmosphere, no day/night blend — the silhouette
 * against deep space is the look. Lighting is fixed in MoonScene; this
 * component is filter-agnostic.
 */
export default function Moon({ rotationSpeed = 0.005 }: Props) {
  return (
    <CelestialBody
      textures={{ day: MOON_TEXTURE }}
      material="standard"
      radius={1}
      segments={128}
      rotationSpeed={rotationSpeed}
      standardProps={{
        roughness: 0.92,
        metalness: 0.0,
        useBumpFromDay: true,
        bumpScale: 0.025,
        // Neutral baseline glow so the shadow side never goes pitch-dark.
        // Same value for every filter.
        emissive: '#4a5570',
        emissiveIntensity: 0.1,
      }}
    />
  );
}
