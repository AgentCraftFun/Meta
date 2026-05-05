'use client';

import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  HEAT_COLORS,
  getOrbitParams,
  orbitPosition,
  type OrbitParams,
} from '@/lib/orbits';
import { useMetaStore } from '@/lib/store';
import type { Token } from '@/lib/types/token';
import SatelliteCard from './SatelliteCard';

type Props = {
  tokens: Token[];
};

/**
 * Single InstancedMesh holding every token satellite. Per-frame transforms
 * update each instance's matrix; per-instance colour is driven by heat tier
 * (HDR so bloom catches the glow). Hover and click are handled by the
 * built-in InstancedMesh raycasting via event.instanceId.
 */
export default function TokenSatellites({ tokens }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoverAnchorRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);

  // Stable orbit params — recomputed only when the token list itself changes
  // (TanStack Query gives us stable refs across refetches with same data).
  const orbitParams = useMemo<OrbitParams[]>(
    () => tokens.map(getOrbitParams),
    [tokens]
  );

  // Reusable scratch objects so we don't allocate per frame.
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const scratch = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);

  // Per-instance colour from heat tier. Run once per token list change.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    tokens.forEach((token, i) => {
      const [r, g, b] = HEAT_COLORS[token.category];
      tempColor.setRGB(r, g, b);
      mesh.setColorAt(i, tempColor);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [tokens, tempColor]);

  // Per-frame transform update for every satellite + hover anchor.
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < tokens.length; i++) {
      const params = orbitParams[i];
      orbitPosition(scratch, params, t);
      tempPos.set(scratch.x, scratch.y, scratch.z);
      tempScale.setScalar(params.size);
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      mesh.setMatrixAt(i, tempMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Anchor for the hover card — follows the hovered satellite.
    if (hoverAnchorRef.current && hoveredId !== null && hoveredId < tokens.length) {
      orbitPosition(scratch, orbitParams[hoveredId], t);
      hoverAnchorRef.current.position.set(scratch.x, scratch.y, scratch.z);
    }
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    setHoveredId((cur) => (cur === e.instanceId ? cur : (e.instanceId ?? null)));
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredId(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const token = tokens[e.instanceId];
    if (!token) return;
    setSelectedToken(
      selectedTokenId === token.id ? null : token.id
    );
  };

  if (tokens.length === 0) return null;

  const hoveredToken = hoveredId !== null ? tokens[hoveredId] : null;

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, tokens.length]}
        frustumCulled={false}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>

      <group ref={hoverAnchorRef}>
        {hoveredToken && (
          <Html
            center
            zIndexRange={[40, 0]}
            style={{ pointerEvents: 'none', transform: 'translate(0, -28px)' }}
          >
            <SatelliteCard token={hoveredToken} />
          </Html>
        )}
      </group>
    </>
  );
}
