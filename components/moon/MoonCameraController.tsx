'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getCraterPosition } from '@/lib/craterPlacement';
import { applyMoonFilter } from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { computeActivity } from '@/lib/tokenActivity';
import { useEffectiveTokens } from '@/lib/useEffectiveTokens';

const TWEEN_MS = 1200;
const MAX_CRATERS = 40;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smoothly arcs the camera to face the clicked crater. Strategy: position
 * the camera along the crater's world-direction from the moon centre, at
 * the same orbital distance the user was already at. The crater ends up
 * in the foreground with the moon body behind it.
 *
 * Ranking here mirrors TokenCraters: top 40 by activity score from the
 * active filter slice. The token's local position comes from
 * getCraterPosition; we apply the named "claimed-surface" group's
 * matrixWorld to handle the moon's rotation and the leftward layout
 * offset.
 */
export default function MoonCameraController() {
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const filter = useMetaStore((s) => s.moonFilter);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const universe = useEffectiveTokens(timeWindow);

  // Reproduce the moon's "top by activity" ranking so we can find the
  // crater's local position from a token id.
  const activeTokens = useMemo(() => {
    const filtered = applyMoonFilter(universe, filter);
    return filtered
      .map((t) => ({ token: t, activity: computeActivity(t) }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, MAX_CRATERS);
  }, [universe, filter]);

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
    const entry = activeTokens.find((e) => e.token.id === selectedTokenId);
    if (!entry) return;

    const surface = scene.getObjectByName('claimed-surface');
    if (!surface) return;
    surface.updateMatrixWorld(true);

    const localPos = getCraterPosition(entry.token);
    const worldPos = localPos.clone().applyMatrix4(surface.matrixWorld);

    const moonCenter = new THREE.Vector3();
    surface.getWorldPosition(moonCenter);

    const distance = camera.position.distanceTo(moonCenter);
    const dir = worldPos.clone().sub(moonCenter).normalize();
    // Slight upward bias so the framing feels three-quarter, not dead-on.
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
  }, [selectedTokenId, activeTokens, scene, camera, controls]);

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
