'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Subtle shooting star that streaks through the space backdrop every
 * 60–90 seconds. A bright HDR head sphere with a tapered, additively-blended
 * cylindrical streak trailing behind. Renders well behind the planet so it
 * never overlaps content and never demands attention — but adds a beat of
 * life to an otherwise still backdrop.
 */

const SHOOTING_INTERVAL_MIN_MS = 60_000;
const SHOOTING_INTERVAL_MAX_MS = 90_000;
const TRAVEL_MS = 1300;
const RADIUS = 60; // distance from origin
const STREAK_LENGTH = 4;
const STREAK_RADIUS = 0.06;
const HEAD_RADIUS = 0.18;

type ShootingState = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  startedAt: number;
};

function randomUnitVector(target: THREE.Vector3): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return target.set(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  );
}

function planSwipe(): ShootingState {
  const startDir = randomUnitVector(new THREE.Vector3());
  const endDir = new THREE.Vector3();
  // Re-roll until we get a sensible angular separation (~30°–90°).
  let dot;
  let attempts = 0;
  do {
    randomUnitVector(endDir);
    dot = startDir.dot(endDir);
    attempts++;
  } while ((dot > 0.85 || dot < 0.0) && attempts < 12);

  return {
    start: startDir.clone().multiplyScalar(RADIUS),
    end: endDir.clone().multiplyScalar(RADIUS),
    startedAt: performance.now(),
  };
}

export default function ShootingStar() {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef<ShootingState | null>(null);
  const headMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // ShaderMaterial owns the streak's fade — bright at the head, tapering
  // along the cylinder's length.
  const streakMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        opacity: { value: 0 },
        color: { value: new THREE.Color(1.4, 1.3, 1.1) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float opacity;
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
          // vUv.y = 0 at the head, 1 at the tail.
          float head = pow(1.0 - vUv.y, 2.0);
          float horiz = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 1.5);
          float a = head * horiz * opacity;
          gl_FragColor = vec4(color, clamp(a, 0.0, 1.0));
        }
      `,
    });
  }, []);

  // Schedule launches at random 60–90s intervals.
  useEffect(() => {
    let timeoutId: number | null = null;

    const schedule = () => {
      const delay =
        SHOOTING_INTERVAL_MIN_MS +
        Math.random() * (SHOOTING_INTERVAL_MAX_MS - SHOOTING_INTERVAL_MIN_MS);
      timeoutId = window.setTimeout(launch, delay);
    };

    const launch = () => {
      stateRef.current = planSwipe();
      schedule();
    };

    schedule();
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const s = stateRef.current;
    if (!s) {
      if (g.visible) g.visible = false;
      return;
    }
    const elapsed = performance.now() - s.startedAt;
    const t = elapsed / TRAVEL_MS;
    if (t >= 1) {
      stateRef.current = null;
      g.visible = false;
      return;
    }
    g.visible = true;

    pos.lerpVectors(s.start, s.end, t);
    g.position.copy(pos);

    // Orient so local -Z points along velocity (forward), +Z points behind
    // the head — that's where the streak cylinder lives.
    velocity.subVectors(s.end, s.start).normalize();
    lookTarget.copy(pos).add(velocity);
    g.lookAt(lookTarget);

    // Fade in the first 15% and out the last 15% of travel.
    const fadeIn = THREE.MathUtils.smoothstep(t, 0, 0.15);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(t, 0.85, 1);
    const fade = fadeIn * fadeOut;
    streakMat.uniforms.opacity.value = fade;
    if (headMatRef.current) headMatRef.current.opacity = fade * 0.95;
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Streak — tapered cylinder, narrow at tail (V=1), wide at head (V=0).
          Rotated so its height axis sits along local +Z (behind the head). */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, STREAK_LENGTH / 2]}
        frustumCulled={false}
      >
        <cylinderGeometry
          args={[
            STREAK_RADIUS * 0.05,
            STREAK_RADIUS,
            STREAK_LENGTH,
            8,
            1,
            true,
          ]}
        />
        <primitive object={streakMat} attach="material" />
      </mesh>

      {/* Bright head — small HDR sphere caught by bloom */}
      <mesh frustumCulled={false}>
        <sphereGeometry args={[HEAD_RADIUS, 12, 12]} />
        <meshBasicMaterial
          ref={headMatRef}
          color={new THREE.Color(1.5, 1.4, 1.2)}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
