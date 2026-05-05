'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getOrbitParams, orbitPosition } from '@/lib/orbits';
import { useMetaStore } from '@/lib/store';
import type { Token } from '@/lib/types/token';

type Props = {
  tokens: Token[];
};

/**
 * Thin emissive cyan ring orbiting the same path as the currently-selected
 * satellite, parked at its instantaneous position. Keeps visual context
 * while the side panel is open.
 */
export default function SelectionRing({ tokens }: Props) {
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const ringRef = useRef<THREE.Mesh>(null);

  const selected = useMemo(() => {
    if (!selectedTokenId) return null;
    const idx = tokens.findIndex((t) => t.id === selectedTokenId);
    if (idx === -1) return null;
    return { token: tokens[idx], params: getOrbitParams(tokens[idx]) };
  }, [tokens, selectedTokenId]);

  const scratch = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);

  useFrame((state) => {
    if (!selected || !ringRef.current) return;
    orbitPosition(scratch, selected.params, state.clock.elapsedTime);
    ringRef.current.position.set(scratch.x, scratch.y, scratch.z);
    ringRef.current.lookAt(state.camera.position);
  });

  if (!selected) return null;

  // Ring radius scales with satellite size; ~3x is a tight but visible halo.
  const innerR = selected.params.size * 2.0;
  const outerR = selected.params.size * 2.6;

  return (
    <mesh ref={ringRef} frustumCulled={false}>
      <ringGeometry args={[innerR, outerR, 48]} />
      <meshBasicMaterial
        color="#22D3EE"
        transparent
        opacity={0.85}
        toneMapped={false}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
