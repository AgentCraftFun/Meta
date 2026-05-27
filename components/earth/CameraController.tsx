'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as ThreeOrbitControls } from 'three-stdlib';
import centroidsRaw from '@/public/data/country-centroids.json';
import { latLngToVec3 } from '@/lib/geo';
import { useMetaStore } from '@/lib/store';

type Centroid = { name: string; lat: number; lng: number };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

const TWEEN_MS = 1200;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Watches the zustand `selectedCountry` and smoothly lerps the camera so the
 * country faces the viewer over ~1.2s with easeInOutCubic. While the tween is
 * running, OrbitControls' autoRotate is paused; user input still works after
 * the tween finishes.
 *
 * The earth-group is itself sliding leftward when the side panel opens, so
 * the camera target is recomputed each frame from the group's CURRENT world
 * position — chasing a moving earth instead of aiming at where it was when
 * the click landed.
 */
export default function CameraController() {
  const { camera, controls, scene } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera;
    controls: ThreeOrbitControls | null;
    scene: THREE.Scene;
  };
  const selectedCountry = useMetaStore((s) => s.selectedCountry);

  const tween = useRef<{
    startCam: THREE.Vector3;
    startTarget: THREE.Vector3;
    /** Direction from earth centre to the country surface, in world space.
     *  Multiplied by `camDistance` each frame to compute a moving endCam. */
    surfaceNormal: THREE.Vector3;
    camDistance: number;
    t0: number;
  } | null>(null);
  const wasAutoRotating = useRef<boolean>(true);

  useEffect(() => {
    if (!selectedCountry) {
      tween.current = null;
      if (controls && wasAutoRotating.current) controls.autoRotate = true;
      return;
    }
    const c = CENTROIDS[selectedCountry];
    if (!c) return;

    const earthGroup = scene.getObjectByName('earth-group');
    const earthCenter = new THREE.Vector3();
    if (earthGroup) {
      earthGroup.updateMatrixWorld(true);
      earthGroup.getWorldPosition(earthCenter);
    }

    const surfaceNormal = latLngToVec3(c.lat, c.lng, 1).normalize();
    const camDistance = Math.max(
      2.2,
      camera.position.distanceTo(earthCenter)
    );

    tween.current = {
      startCam: camera.position.clone(),
      startTarget: controls?.target?.clone() ?? new THREE.Vector3(),
      surfaceNormal,
      camDistance,
      t0: performance.now(),
    };
    if (controls) {
      wasAutoRotating.current = !!controls.autoRotate;
      controls.autoRotate = false;
    }
  }, [selectedCountry, camera, controls, scene]);

  useFrame(() => {
    if (!tween.current) return;
    const { startCam, startTarget, surfaceNormal, camDistance, t0 } =
      tween.current;
    const elapsed = performance.now() - t0;
    const t = Math.min(1, elapsed / TWEEN_MS);
    const k = easeInOutCubic(t);

    // Read earth's CURRENT world position so the camera chases it as the
    // earth-group slides leftward in parallel.
    const earthCenter = new THREE.Vector3();
    const earthGroup = scene.getObjectByName('earth-group');
    if (earthGroup) {
      earthGroup.updateMatrixWorld(true);
      earthGroup.getWorldPosition(earthCenter);
    }
    const endCam = earthCenter
      .clone()
      .add(surfaceNormal.clone().multiplyScalar(camDistance));

    camera.position.lerpVectors(startCam, endCam, k);
    if (controls) {
      controls.target.lerpVectors(startTarget, earthCenter, k);
      controls.update();
    } else {
      camera.lookAt(earthCenter);
    }
    if (t >= 1) {
      tween.current = null;
    }
  });

  return null;
}
