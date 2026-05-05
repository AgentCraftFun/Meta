'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { alignToNormal, hashString } from '@/lib/craterPlacement';

const STREAK_END_MS = 700;
const FLASH_END_MS = 950;
const SHOCK_END_MS = 1300;
const TOTAL_MS = 1500;

type Props = {
  /** Local-space target position on the unit sphere. */
  target: THREE.Vector3;
  /** HDR colour from the token's heat tier. */
  color: THREE.Color;
  /** Symbol used to derive a stable inbound direction per token. */
  symbolSeed: string;
  /** Fires when the impact animation completes. */
  onComplete: () => void;
};

/**
 * The "meteor lands" sequence. Three overlapping phases:
 *
 *   0 .. 700ms   streak — a thin cylinder flies from off-screen to target
 *   700 ..  950  flash  — bright sphere expands + fades at the impact point
 *   700 .. 1300  shock  — flat ring on the surface expands + fades
 *
 * All three layers are additive + HDR so they trigger bloom and read as
 * "glowing impact" rather than 3D primitives.
 */
export default function ImpactEvent({
  target,
  color,
  symbolSeed,
  onComplete,
}: Props) {
  const startRef = useRef<number>(performance.now());
  const finishedRef = useRef(false);

  // Stable inbound direction derived from the symbol so the streak doesn't
  // jitter if the impact re-renders.
  const inboundOffset = useMemo(() => {
    const h = hashString(symbolSeed);
    const theta = ((h * 11) % 1000) / 1000 * Math.PI * 2;
    const phi = ((h * 7) % 1000) / 1000 * Math.PI - Math.PI / 2;
    // Distance from target — well outside the moon so the streak feels far.
    const distance = 4.5;
    return new THREE.Vector3(
      distance * Math.cos(phi) * Math.cos(theta),
      distance * Math.sin(phi),
      distance * Math.cos(phi) * Math.sin(theta)
    );
  }, [symbolSeed]);

  const inboundOrigin = useMemo(
    () => target.clone().add(inboundOffset),
    [target, inboundOffset]
  );

  const surfaceQuat = useMemo(() => alignToNormal(target), [target]);

  // Refs for per-phase meshes / materials so we can mutate without re-rendering.
  const streakRef = useRef<THREE.Mesh>(null);
  const streakMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const flashMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const shockMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Pre-computed orientation vectors for streak.
  const streakLength = inboundOrigin.distanceTo(target);
  const streakDir = useMemo(
    () => target.clone().sub(inboundOrigin).normalize(),
    [target, inboundOrigin]
  );
  const streakQuat = useMemo(() => {
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      streakDir
    );
  }, [streakDir]);

  useFrame(() => {
    if (finishedRef.current) return;
    const elapsed = performance.now() - startRef.current;

    // Phase 1 — streak.
    const streak = streakRef.current;
    const streakMat = streakMatRef.current;
    if (streak && streakMat) {
      if (elapsed < STREAK_END_MS) {
        const t = elapsed / STREAK_END_MS;
        const eased = 1 - Math.pow(1 - t, 3); // ease-in
        // Position streak's centre along the line from origin to target,
        // shrinking the visible portion from full length to nothing.
        const visibleLength = streakLength * (1 - eased);
        const head = inboundOrigin.clone().lerp(target, eased);
        const center = head
          .clone()
          .add(streakDir.clone().multiplyScalar(-visibleLength / 2));
        streak.position.copy(center);
        streak.scale.set(1, Math.max(0.001, visibleLength / streakLength), 1);
        streakMat.opacity = 0.3 + eased * 0.6;
      } else {
        streak.visible = false;
      }
    }

    // Phase 2 — flash.
    const flash = flashRef.current;
    const flashMat = flashMatRef.current;
    if (flash && flashMat) {
      if (elapsed >= STREAK_END_MS && elapsed < FLASH_END_MS) {
        const t = (elapsed - STREAK_END_MS) / (FLASH_END_MS - STREAK_END_MS);
        const scale = THREE.MathUtils.lerp(0.0, 0.04, t);
        flash.scale.setScalar(scale);
        flashMat.opacity = 1 - t;
        flash.visible = true;
      } else {
        flash.visible = false;
      }
    }

    // Phase 3 — shockwave.
    const shock = shockRef.current;
    const shockMat = shockMatRef.current;
    if (shock && shockMat) {
      if (elapsed >= STREAK_END_MS && elapsed < SHOCK_END_MS) {
        const t = (elapsed - STREAK_END_MS) / (SHOCK_END_MS - STREAK_END_MS);
        const scale = THREE.MathUtils.lerp(0.001, 0.06, t);
        shock.scale.setScalar(scale);
        shockMat.opacity = 1 - t;
        shock.visible = true;
      } else {
        shock.visible = false;
      }
    }

    if (elapsed >= TOTAL_MS) {
      finishedRef.current = true;
      onComplete();
    }
  });

  return (
    <group>
      {/* Streak — thin cylinder oriented along the inbound direction.
          It's positioned at its centre and scaled in Y per-frame. */}
      <mesh ref={streakRef} quaternion={streakQuat}>
        <cylinderGeometry args={[0.001, 0.0035, streakLength, 8, 1, true]} />
        <meshBasicMaterial
          ref={streakMatRef}
          color={color}
          transparent
          opacity={0.3}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Flash — bright sphere at the impact point */}
      <mesh ref={flashRef} position={target} visible={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          ref={flashMatRef}
          color={color}
          transparent
          opacity={1}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shockwave — flat ring on the surface, expanding. We mirror
          TokenCrater's pattern: parent group carries the surface quat,
          the ring inside gets the -π/2 X rotation so its native +Z
          normal lines up with the surface normal. */}
      <group position={target} quaternion={surfaceQuat} visible>
        <mesh ref={shockRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.85, 1, 48]} />
          <meshBasicMaterial
            ref={shockMatRef}
            color={color}
            transparent
            opacity={1}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
