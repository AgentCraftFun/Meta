'use client';

import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { makeFlagBannerTexture } from '@/lib/flagBannerTexture';
import { alignToNormal } from '@/lib/moonFlagPlacement';
import type { HeatLevel, Token } from '@/lib/types/token';
import FlagTooltip from './FlagTooltip';

const POLE_HEIGHT = 0.12;
const POLE_RADIUS = 0.0015;
const CAP_RADIUS = 0.0035;
const BANNER_W = 0.06;
const BANNER_H = 0.04;
/** Vertical offset of the banner so it hangs just below the cap. */
const BANNER_DROP = 0.005;

/** HDR colours that trigger bloom on the top cap. >1.0 components on purpose. */
export const HEAT_HDR: Record<HeatLevel, [number, number, number]> = {
  hot: [2.0, 0.3, 0.2],
  warm: [1.8, 1.3, 0.2],
  emerging: [1.4, 1.4, 1.6],
};

type Props = {
  token: Token;
  position: THREE.Vector3;
  /** Cap colour — derived from active filter, not heat. */
  filterColor: string;
  highlighted: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
};

/**
 * A single flag planted on the moon. Group hierarchy:
 *
 *   <group>           ← scale set per-frame by parent for plant anim + hover
 *     <pole>          metallic cylinder
 *     <cap>           HDR sphere — heat-coloured, bloom-catching
 *     <banner>        plane with linear-filtered text texture
 *     <baseGlow>      additive ring at the base, only visible while hovered
 *     <Html>          tooltip, only mounted while hovered
 */
const Flag = forwardRef<THREE.Group, Props>(function Flag(
  {
    token,
    position,
    filterColor,
    highlighted,
    onPointerOver,
    onPointerOut,
    onClick,
  },
  ref
) {
  const orientation = useMemo(() => alignToNormal(position), [position]);
  const bannerTexture = useMemo(
    () => makeFlagBannerTexture(token.symbol, token.category),
    [token.symbol, token.category]
  );

  // Dispose the canvas-backed texture on unmount.
  useEffect(() => {
    return () => bannerTexture.dispose();
  }, [bannerTexture]);

  // HDR cap colour. Reused per render — no allocation in the hot path.
  const capColor = useMemo(() => {
    const [r, g, b] = HEAT_HDR[token.category];
    return new THREE.Color(r, g, b);
  }, [token.category]);

  // Pulse the base glow ring while hovered.
  const baseGlowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    if (highlighted && baseGlowMatRef.current) {
      const t = state.clock.elapsedTime;
      baseGlowMatRef.current.opacity = 0.45 + 0.35 * Math.sin(t * 5);
    }
  });

  return (
    <group ref={ref} position={position} quaternion={orientation}>
      {/* Pole — high-metalness silver, picks up the directional sun */}
      <mesh
        position={[0, POLE_HEIGHT / 2, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 12]} />
        <meshStandardMaterial color="#cccccc" metalness={0.95} roughness={0.25} />
      </mesh>

      {/* Top cap — HDR, blooms */}
      <mesh
        position={[0, POLE_HEIGHT, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[CAP_RADIUS, 16, 16]} />
        <meshBasicMaterial color={capColor} toneMapped={false} />
      </mesh>

      {/* Banner — linear-filtered text on a plane, double-sided */}
      <mesh
        position={[BANNER_W / 2, POLE_HEIGHT - BANNER_H / 2 - BANNER_DROP, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <planeGeometry args={[BANNER_W, BANNER_H]} />
        <meshBasicMaterial
          map={bannerTexture}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Highlight halo around the cap — visible when hovered or selected */}
      {highlighted && (
        <mesh position={[0, POLE_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[CAP_RADIUS * 1.6, CAP_RADIUS * 2.4, 32]} />
          <meshBasicMaterial
            color={filterColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Base glow — pulses cyan/heat at the foot of the pole */}
      {highlighted && (
        <mesh
          position={[0, 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.005, 0.012, 32]} />
          <meshBasicMaterial
            ref={baseGlowMatRef}
            color={filterColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.55}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Tooltip */}
      {highlighted && (
        <Html
          position={[BANNER_W / 2, POLE_HEIGHT + 0.012, 0]}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'none' }}
          center
        >
          <FlagTooltip token={token} />
        </Html>
      )}
    </group>
  );
});

export default Flag;
