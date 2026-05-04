'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
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
 */
export default function CameraController() {
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera;
    controls: any | null;
  };
  const selectedCountry = useMetaStore((s) => s.selectedCountry);

  const tween = useRef<{
    start: THREE.Vector3;
    end: THREE.Vector3;
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

    const normal = latLngToVec3(c.lat, c.lng, 1).normalize();
    const distance = Math.max(2.2, camera.position.length());
    const end = normal.multiplyScalar(distance);

    tween.current = {
      start: camera.position.clone(),
      end,
      t0: performance.now(),
    };
    if (controls) {
      wasAutoRotating.current = !!controls.autoRotate;
      controls.autoRotate = false;
    }
  }, [selectedCountry, camera, controls]);

  useFrame(() => {
    if (!tween.current) return;
    const { start, end, t0 } = tween.current;
    const elapsed = performance.now() - t0;
    const t = Math.min(1, elapsed / TWEEN_MS);
    const k = easeInOutCubic(t);

    camera.position.lerpVectors(start, end, k);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
    if (t >= 1) {
      tween.current = null;
    }
  });

  return null;
}
