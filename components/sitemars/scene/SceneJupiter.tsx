'use client';

import CelestialBody from '@/components/celestial/CelestialBody';

/**
 * /siteMARS Jupiter — the gas-giant globe on the "Buy Backs" card (replaces the
 * orb-bot). Same READ-ONLY <CelestialBody> primitive as the moon, with the 8k
 * Jupiter albedo. No bump (gas giant, no terrain) and a faint warm emissive lift
 * so the shadow limb stays a believable planet instead of crushing to black.
 */

const JUPITER_TEXTURE = '/8k_jupiter.jpg';

export default function SceneJupiter({ rotationSpeed = 0.04 }: { rotationSpeed?: number }) {
  return (
    <CelestialBody
      textures={{ day: JUPITER_TEXTURE }}
      material="standard"
      radius={1}
      segments={96}
      rotationSpeed={rotationSpeed}
      standardProps={{
        roughness: 0.88,
        metalness: 0.0,
        emissive: '#3a2a18',
        emissiveIntensity: 0.22,
      }}
    />
  );
}
