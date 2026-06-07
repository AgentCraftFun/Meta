'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CAMERA_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { WAYPOINT_LOOK, WAYPOINT_POS } from './waypoints';

/**
 * Flies the persistent camera along the waypoint table. Each frame:
 *   - earth+clouds group auto-rotates 0.04 rad/s (linear)
 *   - camera position + lookAt target exponentially damp toward the active
 *     section's waypoint (lambda 4 → ~0.06/frame @60fps; THREE.MathUtils.damp
 *     gives the spec's exact per-frame factor — see p2 note). Never snaps.
 *   - mouse parallax ±0.1 / ±0.07 (lerp 0.05) layered on top
 *
 * `lockFlight` (mobile-light): ignore activeSection, hold waypoint 0.
 * `frozen` (reduced — canvas not normally mounted): no rotation/parallax/flight.
 */
const PARALLAX_X = 0.1;
const PARALLAX_Y = 0.07;
/** Radians the globe rotates per section travelled (scroll-linked spin). */
const SPIN_PER_SECTION = 2.2;

export default function CameraRig({
  earthGroupRef,
  frozen = false,
  lockFlight = false,
}: {
  earthGroupRef: React.RefObject<THREE.Group>;
  frozen?: boolean;
  lockFlight?: boolean;
}) {
  const { camera, size } = useThree();
  const targetMouse = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });
  const lookCurrent = useRef(new THREE.Vector3().copy(WAYPOINT_LOOK[0]));
  const posTarget = useRef(new THREE.Vector3().copy(WAYPOINT_POS[0]));
  const lookTarget = useRef(new THREE.Vector3().copy(WAYPOINT_LOOK[0]));
  const autoSpin = useRef(0);

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
    const dt = Math.min(delta, 0.05);

    // Globe rotation: gentle ambient spin + a scroll-linked spin driven by the
    // damped travel index from GlobeStageController, so the earth visibly turns
    // as it travels between scenes. This rotates the GROUP only — the camera
    // stays hard-locked (idx 0 below), so the canvas never resizes/reframes.
    if (!frozen && earthGroupRef.current) {
      autoSpin.current += 0.04 * dt;
      const travel = useSceneStore.getState().globeTravel;
      earthGroupRef.current.rotation.y = autoSpin.current + travel * SPIN_PER_SECTION;
    }

    // CAMERA HARD-LOCKED to the Hero waypoint, unconditionally. The per-section
    // waypoint flight is what shifted/resized the globe ~1s after each scroll
    // (camera damping between waypoints) and fought the CSS slot positions.
    // The globe now moves ONLY via the CSS transform; the camera never flies.
    const idx = 0;
    posTarget.current.copy(WAYPOINT_POS[idx]);
    lookTarget.current.copy(WAYPOINT_LOOK[idx]);

    // Mouse parallax (skip on mobile-light / frozen).
    if (!frozen && !lockFlight) {
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
      posTarget.current.x += smoothedMouse.current.x * PARALLAX_X;
      posTarget.current.y -= smoothedMouse.current.y * PARALLAX_Y;
    }

    // Damp position.
    camera.position.x = THREE.MathUtils.damp(camera.position.x, posTarget.current.x, CAMERA_LAMBDA, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, posTarget.current.y, CAMERA_LAMBDA, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, posTarget.current.z, CAMERA_LAMBDA, dt);

    // Damp the lookAt target too, so re-aims glide instead of snapping.
    lookCurrent.current.x = THREE.MathUtils.damp(lookCurrent.current.x, lookTarget.current.x, CAMERA_LAMBDA, dt);
    lookCurrent.current.y = THREE.MathUtils.damp(lookCurrent.current.y, lookTarget.current.y, CAMERA_LAMBDA, dt);
    lookCurrent.current.z = THREE.MathUtils.damp(lookCurrent.current.z, lookTarget.current.z, CAMERA_LAMBDA, dt);
    camera.lookAt(lookCurrent.current);

    // DEV telemetry → GlobePlacer panel: prove whether the camera/canvas move.
    useSceneStore.getState().setSceneDebug(
      `cam ${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)} · gl ${size.width}x${size.height}`
    );
  });

  return null;
}
