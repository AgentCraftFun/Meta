'use client';

import CelestialBody from '@/components/celestial/CelestialBody';

const MOON_TEXTURE = '/textures/8k_moon.jpg';

type Props = {
  /** Y-axis rotation rate. Default 0.005 rad/s. Pass 0 to defer rotation
   *  to a parent group (e.g. when flags need to rotate WITH the moon). */
  rotationSpeed?: number;
};

/**
 * Hyperrealistic 3D moon: NASA equirectangular albedo doubling as a bump
 * map for free crater depth, very rough material (the moon is dusty,
 * non-metallic). No atmosphere, no day/night blend — the silhouette
 * against deep space is the look. Rotation rate is exposed so the moon
 * can either spin on its own or sit still inside a parent that rotates
 * the whole "claimed surface" — body + flags — together.
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
        roughness: 0.95,
        metalness: 0.0,
        useBumpFromDay: true,
        bumpScale: 0.02,
      }}
    />
  );
}
