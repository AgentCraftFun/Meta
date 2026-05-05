'use client';

import { type MutableRefObject } from 'react';
import type * as THREE from 'three';
import CelestialBody from '@/components/celestial/CelestialBody';

const MOON_TEXTURE = '/textures/8k_moon.jpg';

type Props = {
  /** Y-axis rotation rate. Default 0.005 rad/s. Pass 0 to defer rotation
   *  to a parent group (e.g. when flags need to rotate WITH the moon). */
  rotationSpeed?: number;
  /** Optional ref filled with the moon's MeshStandardMaterial so the
   *  parent scene can tween emissive colour for filter-driven lighting. */
  materialRef?: MutableRefObject<THREE.Material | null>;
};

/**
 * Hyperrealistic 3D moon: NASA equirectangular albedo doubling as a bump
 * map for free crater depth, very rough material (the moon is dusty,
 * non-metallic). No atmosphere, no day/night blend — the silhouette
 * against deep space is the look. Rotation rate is exposed so the moon
 * can either spin on its own or sit still inside a parent that rotates
 * the whole "claimed surface" — body + flags — together.
 */
export default function Moon({ rotationSpeed = 0.005, materialRef }: Props) {
  return (
    <CelestialBody
      textures={{ day: MOON_TEXTURE }}
      material="standard"
      radius={1}
      segments={128}
      rotationSpeed={rotationSpeed}
      materialRef={materialRef}
      standardProps={{
        roughness: 0.92,
        metalness: 0.0,
        useBumpFromDay: true,
        bumpScale: 0.025,
        // Lifted baseline glow so the shadow side reads as moon-grey rather
        // than void-black. Tinted slightly cool — the filter-driven tween
        // in MoonScene shifts this hue per active filter.
        emissive: '#4a5570',
        emissiveIntensity: 0.1,
      }}
    />
  );
}
