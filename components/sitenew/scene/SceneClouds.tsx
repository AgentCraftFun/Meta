'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { TextureTier } from './deviceTier';

/**
 * /siteNEW clouds. Functionally identical to the read-only
 * components/earth/Clouds.tsx, but sources the device-tiered optimized cloud
 * WebP instead of the 8k JPG (the original hardcodes the 8k path).
 *
 * REDUCED-MOTION: pass `frozen` to stop the independent cloud drift.
 */
export default function SceneClouds({
  tier,
  frozen = false,
}: {
  tier: TextureTier;
  frozen?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudMap = useTexture(`/textures/sitenew/earth_clouds_${tier}.webp`);
  cloudMap.colorSpace = THREE.NoColorSpace;
  cloudMap.anisotropy = 8;

  useFrame((_, delta) => {
    if (!frozen && meshRef.current) meshRef.current.rotation.y += 0.015 * delta;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.005, 64, 64]} />
      <meshPhongMaterial
        color="#ffffff"
        alphaMap={cloudMap}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}
