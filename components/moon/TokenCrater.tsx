'use client';

import { type ThreeEvent } from '@react-three/fiber';
import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { HEAT_HDR, alignToNormal } from '@/lib/craterPlacement';
import type { Token } from '@/lib/types/token';

type Props = {
  token: Token;
  position: THREE.Vector3;
  /** 0..1 — drives radius, opacity, shaft brightness. */
  activity: number;
  highlighted: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
};

const SHAFT_HEIGHT = 0.07;

/**
 * A single crater on the moon's surface. Three additive layers, all
 * sharing the heat HDR colour:
 *
 *   1. base ring  — flat ring on the surface, sized by activity
 *   2. inner disk — circular fill inside the ring, the "molten core"
 *   3. light shaft — thin vertical beam rising 0.05 units, marks the
 *                    location even when the moon is zoomed out
 *
 * The whole thing is wrapped in a forwarded group so the parent
 * orchestrator can mutate scale per-frame for hover boosts and
 * fade-in/out without re-rendering.
 */
const TokenCrater = forwardRef<THREE.Group, Props>(function TokenCrater(
  { token, position, activity, highlighted, onPointerOver, onPointerOut, onClick },
  ref
) {
  const orientation = useMemo(() => alignToNormal(position), [position]);
  const colour = useMemo(() => {
    const [r, g, b] = HEAT_HDR[token.category];
    return new THREE.Color(r, g, b);
  }, [token.category]);

  // Activity drives geometry. Hot stuff = bigger.
  const baseRadius = 0.012 + activity * 0.025;
  const ringWidth = 0.003 + activity * 0.004;
  const innerRadius = Math.max(0.002, baseRadius - ringWidth - 0.001);

  const ringOpacity = 0.6 + activity * 0.4;
  const disqOpacity = 0.15 + activity * 0.25;
  const shaftOpacity = 0.7 + activity * 0.25;

  return (
    <group
      ref={ref}
      position={position}
      quaternion={orientation}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {/* Base ring — flat on the surface, additive */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]}>
        <ringGeometry args={[baseRadius - ringWidth, baseRadius, 32]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={ringOpacity}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow disk — molten core */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[innerRadius, 24]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={disqOpacity}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical light shaft — slightly tapered, additive HDR. The base
          is wider so it reads as a flare rooted in the surface. */}
      <mesh position={[0, SHAFT_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.0012, 0.0022, SHAFT_HEIGHT, 8]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={shaftOpacity}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Highlight ring — cyan outline when active */}
      {highlighted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]}>
          <ringGeometry args={[baseRadius + 0.001, baseRadius + 0.004, 48]} />
          <meshBasicMaterial
            color="#22D3EE"
            transparent
            opacity={0.85}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
});

export default TokenCrater;
