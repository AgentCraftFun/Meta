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
import { playTick } from '@/lib/sound';
import { useMetaStore } from '@/lib/store';
import type { Token } from '@/lib/types/token';
import SatelliteCard from './SatelliteCard';

type Props = {
  tokens: Token[];
};

/** Per-instance fade duration. Token enters / leaves over this window. */
const FADE_MS = 300;

/**
 * Pre-allocated InstancedMesh capacity. Slots beyond the active count are
 * parked at scale 0 so they're invisible. Set well above the largest mock
 * window count so window switches don't reallocate the buffer.
 */
const MAX_INSTANCES = 256;

type Slot = {
  token: Token;
  params: OrbitParams;
  /** 0..1, current visible scale multiplier. */
  fade: number;
  /** 0 (fading out, will be removed at 0) or 1 (visible). */
  target: number;
};

/**
 * Single InstancedMesh holding every active token satellite. Per-frame the
 * loop walks the slot map updating each instance's transform. New tokens
 * fade in (scale 0 → 1 over FADE_MS), removed tokens fade out and free
 * their slot. Hover and click ride built-in InstancedMesh raycasting via
 * event.instanceId — we keep slot→tokenId on hand for resolution.
 */
export default function TokenSatellites({ tokens }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoverAnchorRef = useRef<THREE.Group>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);

  // Stable per-slot state. We use indices as keys so the map is sparse and
  // unused slots have no entry — those slots stay parked at scale 0.
  const slots = useRef<Map<number, Slot>>(new Map());
  const tokenSlot = useRef<Map<string, number>>(new Map());
  const freeSlots = useRef<number[]>(
    Array.from({ length: MAX_INSTANCES }, (_, i) => MAX_INSTANCES - 1 - i)
  );

  // Reusable scratch objects so the per-frame loop allocates nothing.
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const zeroMatrix = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);
  const scratch = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);

  // Park every instance at scale 0 on first mount so unused slots don't
  // render as a stack of unit spheres at the origin.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < MAX_INSTANCES; i++) {
      mesh.setMatrixAt(i, zeroMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [zeroMatrix]);

  // Reconcile slots with the latest tokens prop. New ids get a fresh slot
  // with target=1, fade=0; departed ids get target=0 (fade-out is driven
  // in useFrame and frees the slot when fade hits 0).
  useEffect(() => {
    const incoming = new Set(tokens.map((t) => t.id));

    // Mark removed tokens for fade-out.
    for (const [id, slotIdx] of tokenSlot.current) {
      if (!incoming.has(id)) {
        const s = slots.current.get(slotIdx);
        if (s) s.target = 0;
      }
    }

    // Add new tokens + reactivate any in flight.
    for (const token of tokens) {
      const existingSlot = tokenSlot.current.get(token.id);
      if (existingSlot !== undefined) {
        const s = slots.current.get(existingSlot);
        if (s) {
          s.target = 1;
          s.token = token; // refresh metadata in case price/momentum changed
          s.params = getOrbitParams(token);
        }
        continue;
      }
      const slotIdx = freeSlots.current.pop();
      if (slotIdx === undefined) continue; // out of capacity
      slots.current.set(slotIdx, {
        token,
        params: getOrbitParams(token),
        fade: 0,
        target: 1,
      });
      tokenSlot.current.set(token.id, slotIdx);

      // Set the heat colour for the new slot.
      const mesh = meshRef.current;
      if (mesh) {
        const [r, g, b] = HEAT_COLORS[token.category];
        tempColor.setRGB(r, g, b);
        mesh.setColorAt(slotIdx, tempColor);
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
  }, [tokens, tempColor]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const fadeStep = (delta * 1000) / FADE_MS;

    const toRemove: number[] = [];

    for (const [slotIdx, sat] of slots.current) {
      // Step fade toward target.
      if (sat.fade < sat.target) {
        sat.fade = Math.min(sat.target, sat.fade + fadeStep);
      } else if (sat.fade > sat.target) {
        sat.fade = Math.max(sat.target, sat.fade - fadeStep);
      }

      // Compose this slot's transform.
      orbitPosition(scratch, sat.params, t);
      tempPos.set(scratch.x, scratch.y, scratch.z);
      tempScale.setScalar(sat.params.size * sat.fade);
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      mesh.setMatrixAt(slotIdx, tempMatrix);

      // Schedule slot release when a fading-out satellite hits 0.
      if (sat.fade === 0 && sat.target === 0) toRemove.push(slotIdx);
    }

    // Free slots that finished fading out.
    for (const slotIdx of toRemove) {
      const sat = slots.current.get(slotIdx);
      if (!sat) continue;
      tokenSlot.current.delete(sat.token.id);
      slots.current.delete(slotIdx);
      freeSlots.current.push(slotIdx);
      mesh.setMatrixAt(slotIdx, zeroMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Drive the hover-card anchor — follow the hovered satellite's orbit.
    if (hoverAnchorRef.current && hoveredSlot !== null) {
      const sat = slots.current.get(hoveredSlot);
      if (sat && sat.fade > 0.5) {
        orbitPosition(scratch, sat.params, t);
        hoverAnchorRef.current.position.set(scratch.x, scratch.y, scratch.z);
      }
    }
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const sat = slots.current.get(e.instanceId);
    if (!sat || sat.target === 0) return; // ignore fading-out satellites
    setHoveredSlot((cur) => (cur === e.instanceId ? cur : (e.instanceId ?? null)));
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredSlot(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const sat = slots.current.get(e.instanceId);
    if (!sat || sat.target === 0) return;
    if (!useMetaStore.getState().muted) playTick();
    setSelectedToken(
      selectedTokenId === sat.token.id ? null : sat.token.id
    );
  };

  const hoveredToken =
    hoveredSlot !== null ? slots.current.get(hoveredSlot)?.token ?? null : null;

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_INSTANCES]}
        frustumCulled={false}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Low-res sphere — 8 segments is a clean perf trade for >100 satellites
            and reads as a glowing point with bloom catching the silhouette. */}
        <sphereGeometry args={[1, 8, 8]} />
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
