'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { getOrbitParams } from '@/lib/orbits';
import type { Token } from '@/lib/types/token';

const TOP_N = 30;

type Props = {
  tokens: Token[];
};

/**
 * Faint cyan ring per orbital plane for the top N tokens by market cap.
 * Each ring is rotated to match its token's inclination; cumulative they
 * read as a delicate planetary lattice around the moon.
 */
export default function OrbitTrails({ tokens }: Props) {
  const top = useMemo(
    () =>
      [...tokens]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, TOP_N),
    [tokens]
  );

  if (top.length === 0) return null;

  return (
    <group>
      {top.map((token) => {
        const { radius, inclination } = getOrbitParams(token);
        return (
          <mesh
            key={token.id}
            rotation={[Math.PI / 2 - inclination, 0, 0]}
            frustumCulled={false}
          >
            <ringGeometry args={[radius - 0.003, radius + 0.003, 128]} />
            <meshBasicMaterial
              color="#22D3EE"
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
