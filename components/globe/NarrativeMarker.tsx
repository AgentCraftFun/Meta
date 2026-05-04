'use client';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { memo, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { latLngToVec3, surfaceQuaternion } from '@/lib/geo';
import type { Narrative, NarrativeCategory } from '@/lib/types';
import MarkerCard from './MarkerCard';

const COLORS: Record<NarrativeCategory, string> = {
  breaking: '#ffb547', // amber
  trending: '#5ef0ff', // cyan
  emerging: '#b48bff', // violet
};

export type CountryGroup = {
  iso: string;
  name: string;
  lat: number;
  lng: number;
  top: Narrative;
  total: number;
};

type Props = {
  group: CountryGroup;
  selected: boolean;
  dimmed: boolean;
  onClick: (iso: string) => void;
};

const STEM_HEIGHT = 0.04;
const HEAD_RADIUS = 0.012;

function NarrativeMarkerImpl({
  group,
  selected,
  dimmed,
  onClick,
}: Props) {
  const { iso, name, lat, lng, top } = group;
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const headMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const stemMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const colorHex = COLORS[top.category];
  const color = useMemo(() => new THREE.Color(colorHex), [colorHex]);

  // Surface anchor + orientation so local +Y points outward.
  const surfacePos = useMemo(() => latLngToVec3(lat, lng, 1), [lat, lng]);
  const orientation = useMemo(() => surfaceQuaternion(lat, lng), [lat, lng]);

  // Volume drives marker size: roughly 0.7× → 1.6× of base.
  const sizeScale = 0.7 + (top.volume / 100) * 0.9;

  // Faster pulse when momentum is hot.
  const pulsePeriod = top.momentum > 0.5 ? 0.9 : 1.5;

  // Shared scratch vectors so we don't allocate per frame.
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const surfaceNormal = useMemo(() => surfacePos.clone().normalize(), [surfacePos]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const phase = (t % pulsePeriod) / pulsePeriod; // 0..1
    const ringScale = 1 + phase * 0.6; // 1..1.6
    const ringAlpha = (1 - phase) * 0.65;

    if (ringRef.current) ringRef.current.scale.setScalar(ringScale);
    if (ringMatRef.current) ringMatRef.current.opacity = ringAlpha;

    // Backside fade — markers on the far hemisphere drop to ~10% opacity.
    camera.getWorldPosition(camDir).normalize();
    const facing = surfaceNormal.dot(camDir);
    const visibility = THREE.MathUtils.smoothstep(facing, -0.05, 0.25);
    const baseOpacity = dimmed && !selected ? 0.4 : 1.0;
    const opacity = visibility * baseOpacity + (1 - visibility) * 0.1;

    if (headMatRef.current) headMatRef.current.opacity = opacity;
    if (stemMatRef.current) stemMatRef.current.opacity = opacity * 0.85;
    if (ringMatRef.current) {
      ringMatRef.current.opacity = ringAlpha * opacity;
    }
  });

  const showCard = hovered || selected;

  return (
    <group
      ref={groupRef}
      position={surfacePos}
      quaternion={orientation}
      scale={sizeScale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(iso);
      }}
    >
      {/* Stem */}
      <mesh position={[0, STEM_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[0.0014, 0.0014, STEM_HEIGHT, 6]}
        />
        <meshBasicMaterial
          ref={stemMatRef}
          color={color}
          toneMapped={false}
          transparent
        />
      </mesh>

      {/* Glowing head */}
      <mesh position={[0, STEM_HEIGHT, 0]}>
        <sphereGeometry args={[HEAD_RADIUS, 18, 18]} />
        <meshBasicMaterial
          ref={headMatRef}
          color={color}
          toneMapped={false}
          transparent
        />
      </mesh>

      {/* Pulsing halo — sphere that scales 1→1.6 and fades */}
      <mesh ref={ringRef} position={[0, STEM_HEIGHT, 0]}>
        <sphereGeometry args={[HEAD_RADIUS * 1.6, 20, 20]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          toneMapped={false}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Hover/selected card */}
      {showCard && (
        <Html
          position={[0, STEM_HEIGHT + HEAD_RADIUS * 2.2, 0]}
          distanceFactor={1.2}
          zIndexRange={[40, 0]}
          occlude={false}
          center={false}
          style={{ pointerEvents: 'none' }}
        >
          <MarkerCard
            iso={iso}
            name={name}
            narrative={top}
            colorHex={colorHex}
            totalForCountry={group.total}
          />
        </Html>
      )}
    </group>
  );
}

const NarrativeMarker = memo(NarrativeMarkerImpl, (prev, next) => {
  // Skip re-render unless visible state, dim state, or the underlying
  // top-narrative changes (id + volume + category + momentum cover the
  // visual surface).
  if (prev.selected !== next.selected) return false;
  if (prev.dimmed !== next.dimmed) return false;
  if (prev.onClick !== next.onClick) return false;
  const a = prev.group;
  const b = next.group;
  if (a.iso !== b.iso) return false;
  if (a.total !== b.total) return false;
  if (a.top.id !== b.top.id) return false;
  if (a.top.volume !== b.top.volume) return false;
  if (a.top.category !== b.top.category) return false;
  if (a.top.momentum !== b.top.momentum) return false;
  return true;
});

export default NarrativeMarker;
