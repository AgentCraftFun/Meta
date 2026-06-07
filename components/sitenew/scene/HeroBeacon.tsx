'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { latLngToVec3, surfaceQuaternion } from '@/lib/geo';
import { useSceneStore } from '../system/useSceneStore';

/**
 * The first beacon. A cyan light pillar standing off the surface that ignites
 * (intensity 0 → 1) once scrollProgress crosses 0.02. Lives inside the rotating
 * earth group so it sticks to its lat/long.
 *
 * Ignite easing approximates 0.6s expoOut via exp damping (lambda 7 ≈ ~0.5s
 * settle); REDUCED-MOTION snaps to full intensity instantly.
 *
 * (Phase 4 generalizes the surface into an instanced BeaconField; this seeds it.)
 */
const PILLAR_HEIGHT = 0.24;
const MAX_OPACITY = 0.9;

export default function HeroBeacon({
  lat = 38,
  lng = -97,
  color = '#22D3EE',
}: {
  lat?: number;
  lng?: number;
  color?: string;
}) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const pillarRef = useRef<THREE.Mesh>(null);
  const pointRef = useRef<THREE.Mesh>(null);
  const pillarMat = useRef<THREE.MeshBasicMaterial>(null);
  const pointMat = useRef<THREE.MeshBasicMaterial>(null);
  const intensity = useRef(0);

  const base = useMemo(() => latLngToVec3(lat, lng, 1), [lat, lng]);
  const quat = useMemo(() => surfaceQuaternion(lat, lng), [lat, lng]);
  const col = useMemo(() => new THREE.Color(color).multiplyScalar(1.4), [color]);

  useFrame((_, delta) => {
    const lit = useSceneStore.getState().scrollProgress > 0.02;
    const target = lit ? 1 : 0;
    intensity.current = reduced
      ? target
      : THREE.MathUtils.damp(intensity.current, target, 7, Math.min(delta, 0.05));

    const i = intensity.current;
    if (pillarRef.current) pillarRef.current.scale.y = Math.max(0.001, i);
    if (pillarMat.current) pillarMat.current.opacity = i * MAX_OPACITY;
    if (pointMat.current) pointMat.current.opacity = i;
    if (pointRef.current) pointRef.current.scale.setScalar(0.6 + i * 0.6);
  });

  return (
    <group position={base} quaternion={quat}>
      {/* light pillar — local +Y is the outward surface normal */}
      <mesh ref={pillarRef} position={[0, PILLAR_HEIGHT / 2, 0]} scale={[1, 0.001, 1]}>
        <cylinderGeometry args={[0.004, 0.012, PILLAR_HEIGHT, 8, 1, true]} />
        <meshBasicMaterial
          ref={pillarMat}
          color={col}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* base point — bright, caught by bloom */}
      <mesh ref={pointRef}>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial
          ref={pointMat}
          color={col}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
