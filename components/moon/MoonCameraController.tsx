'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { applyMoonFilter } from '@/lib/moonFlags';
import { getFlagPosition } from '@/lib/moonFlagPlacement';
import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';

const TWEEN_MS = 1200;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smoothly arcs the camera to face the clicked flag. Strategy: position
 * the camera along the flag's world-direction from the moon centre, at
 * the same orbital distance the user was already at. This places the
 * flag in the foreground with the moon body behind it.
 *
 * - Reads selectedTokenId + the active filter / time window to recover
 *   the flag's local position on the unit sphere.
 * - Walks the scene for the named "claimed-surface" group so it can
 *   apply that group's matrixWorld to convert local → world (handles
 *   the moon's rotation and the leftward layout offset).
 * - Lerps camera.position + controls.target with easeInOutCubic over
 *   1.2s. OrbitControls.update() is called per frame so the user can
 *   resume manual control immediately when the tween finishes.
 */
export default function MoonCameraController() {
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const filter = useMetaStore((s) => s.moonFilter);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const { data } = useTokens(timeWindow);

  const filteredTokens = useMemo(
    () => applyMoonFilter(data?.tokens ?? [], filter),
    [data, filter]
  );

  const { camera, controls, scene } = useThree() as {
    camera: THREE.PerspectiveCamera;
    controls: any | null;
    scene: THREE.Scene;
  };

  const tween = useRef<{
    startCam: THREE.Vector3;
    endCam: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    t0: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedTokenId) {
      tween.current = null;
      return;
    }
    const rank = filteredTokens.findIndex((t) => t.id === selectedTokenId);
    if (rank === -1) return;

    const surface = scene.getObjectByName('claimed-surface');
    if (!surface) return;
    surface.updateMatrixWorld(true);

    // Flag world position = local rank-spiral point × surface group's matrix.
    const localPos = getFlagPosition(rank, filteredTokens.length);
    const worldPos = localPos.clone().applyMatrix4(surface.matrixWorld);

    const moonCenter = new THREE.Vector3();
    surface.getWorldPosition(moonCenter);

    // Camera ends along the flag direction at the user's current zoom.
    const distance = camera.position.distanceTo(moonCenter);
    const dir = worldPos.clone().sub(moonCenter).normalize();
    // Slight offset of camera up so the flag isn't dead-centre — gives
    // a more cinematic three-quarter framing.
    const endCam = moonCenter
      .clone()
      .add(dir.multiplyScalar(distance))
      .add(new THREE.Vector3(0, 0.05, 0));

    const startTarget = controls?.target?.clone() ?? new THREE.Vector3();

    tween.current = {
      startCam: camera.position.clone(),
      endCam,
      startTarget,
      endTarget: moonCenter.clone(),
      t0: performance.now(),
    };
  }, [selectedTokenId, filteredTokens, scene, camera, controls]);

  useFrame(() => {
    if (!tween.current) return;
    const { startCam, endCam, startTarget, endTarget, t0 } = tween.current;
    const elapsed = performance.now() - t0;
    const t = Math.min(1, elapsed / TWEEN_MS);
    const k = easeInOutCubic(t);

    camera.position.lerpVectors(startCam, endCam, k);
    if (controls) {
      controls.target.lerpVectors(startTarget, endTarget, k);
      controls.update();
    } else {
      camera.lookAt(endTarget);
    }

    if (t >= 1) tween.current = null;
  });

  return null;
}
