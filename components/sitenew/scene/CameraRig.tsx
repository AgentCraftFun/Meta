'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CAMERA_LAMBDA } from '../system/motion';

/**
 * Drives the persistent camera. PHASE 2: a single waypoint (the hero frame) —
 * no scroll flight yet. Each frame:
 *   - earth+clouds group auto-rotates 0.04 rad/s (linear)
 *   - camera position exponentially damps toward waypoint0 + mouse parallax
 *     (lambda 4 → ~0.06/frame @60fps, via THREE.MathUtils.damp; maath v0.10
 *     reparameterized damp3 to smoothTime, so we use the lambda-exact form to
 *     hit the spec's stated per-frame factor)
 *   - parallax offset ±0.1 / ±0.07, smoothed at lerp 0.05
 *
 * REDUCED-MOTION (`frozen`): no rotation, no parallax. Camera is pinned at the
 * waypoint (it damps to it once on mount, then holds — a static frame).
 */

// Waypoint 0 — the hero frame. (Phase 4 expands this into a table.)
const WP0_POS = new THREE.Vector3(1.6, 0.5, 2.3);
const WP0_LOOK = new THREE.Vector3(-0.4, 0, 0);

const PARALLAX_X = 0.1;
const PARALLAX_Y = 0.07;

export default function CameraRig({
  earthGroupRef,
  frozen = false,
}: {
  earthGroupRef: React.RefObject<THREE.Group>;
  frozen?: boolean;
}) {
  const { camera } = useThree();
  const targetMouse = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3().copy(WP0_POS));

  useEffect(() => {
    if (frozen) return;
    const onMove = (e: MouseEvent) => {
      targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [frozen]);

  useFrame((_, delta) => {
    // dt clamp guards against tab-restore jumps.
    const dt = Math.min(delta, 0.05);

    if (!frozen && earthGroupRef.current) {
      earthGroupRef.current.rotation.y += 0.04 * dt;
    }

    if (!frozen) {
      smoothedMouse.current.x = THREE.MathUtils.lerp(
        smoothedMouse.current.x,
        targetMouse.current.x,
        0.05
      );
      smoothedMouse.current.y = THREE.MathUtils.lerp(
        smoothedMouse.current.y,
        targetMouse.current.y,
        0.05
      );
    }

    target.current.set(
      WP0_POS.x + smoothedMouse.current.x * PARALLAX_X,
      WP0_POS.y - smoothedMouse.current.y * PARALLAX_Y,
      WP0_POS.z
    );

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      target.current.x,
      CAMERA_LAMBDA,
      dt
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      target.current.y,
      CAMERA_LAMBDA,
      dt
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      target.current.z,
      CAMERA_LAMBDA,
      dt
    );
    camera.lookAt(WP0_LOOK);
  });

  return null;
}
