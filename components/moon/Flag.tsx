'use client';

import { Html } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { alignToNormal } from '@/lib/moonFlagPlacement';
import { makePixelTextTexture } from '@/lib/pixelTextTexture';
import type { Token } from '@/lib/types/token';
import FlagTooltip from './FlagTooltip';

const POLE_HEIGHT = 0.12;
const POLE_RADIUS = 0.0015;
const CAP_RADIUS = 0.003;
const BANNER_W = 0.06;
const BANNER_H = 0.04;
/** Vertical offset of the banner so it hangs just below the cap. */
const BANNER_DROP = 0.005;

type Props = {
  token: Token;
  position: THREE.Vector3;
  filterColor: string;
  highlighted: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
};

/**
 * A single flag planted on the moon. Pole + cap + banner, plus a tooltip
 * + highlight halo that show only when this flag is the active one.
 *
 * The group is forwarded so the parent (TokenFlags) can mutate its scale
 * per-frame for fade in/out without re-rendering.
 */
const Flag = forwardRef<THREE.Group, Props>(function Flag(
  { token, position, filterColor, highlighted, onPointerOver, onPointerOut, onClick },
  ref
) {
  const orientation = useMemo(() => alignToNormal(position), [position]);
  const symbolTexture = useMemo(
    () => makePixelTextTexture(token.symbol, token.category),
    [token.symbol, token.category]
  );

  // Dispose canvas-backed texture on unmount so we don't leak GPU memory
  // when filters churn.
  useEffect(() => {
    return () => {
      symbolTexture.dispose();
    };
  }, [symbolTexture]);

  // Refs for the highlight ring — hidden when not the active flag.
  const ringRef = useRef<THREE.Mesh>(null);

  return (
    <group ref={ref} position={position} quaternion={orientation}>
      {/* Pole — metallic with a subtle filter-coloured rim glow */}
      <mesh
        position={[0, POLE_HEIGHT / 2, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 8]} />
        <meshStandardMaterial
          color="#888"
          metalness={0.9}
          roughness={0.4}
          emissive={filterColor}
          emissiveIntensity={highlighted ? 1.0 : 0.3}
          transparent
        />
      </mesh>

      {/* Top cap — bright HDR dot, the filter "flag colour" */}
      <mesh
        position={[0, POLE_HEIGHT, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <sphereGeometry args={[CAP_RADIUS, 12, 12]} />
        <meshBasicMaterial
          color={filterColor}
          toneMapped={false}
          transparent
        />
      </mesh>

      {/* Banner — pixel-art texture rendered to canvas. The banner offsets
          to one side of the pole so it reads clearly. DoubleSide so it's
          visible regardless of rotation around the pole. */}
      <mesh
        position={[BANNER_W / 2, POLE_HEIGHT - BANNER_H / 2 - BANNER_DROP, 0]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <planeGeometry args={[BANNER_W, BANNER_H]} />
        <meshBasicMaterial
          map={symbolTexture}
          side={THREE.DoubleSide}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* Highlight halo around the cap, only when active */}
      {highlighted && (
        <mesh
          ref={ringRef}
          position={[0, POLE_HEIGHT, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[CAP_RADIUS * 1.8, CAP_RADIUS * 2.6, 32]} />
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

      {/* Tooltip — only when active */}
      {highlighted && (
        <Html
          position={[BANNER_W / 2, POLE_HEIGHT + 0.01, 0]}
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
