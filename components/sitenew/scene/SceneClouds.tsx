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
      {/* The globe canvas is alpha:true (only the disc shows; the page bg shows
          everywhere else). With plain NormalBlending the clouds' src-alpha also
          blends the DESTINATION alpha (resultA = srcA² + dstA·(1-srcA)), pulling
          the opaque earth's framebuffer alpha back below 1 wherever clouds are
          dense — those pixels then composite as semi-transparent over the page
          and reveal the dark stage behind, i.e. the globe reads "see-through"
          (worst at the top where it juts above the Vision card). Fix: keep
          NormalBlending for COLOUR but leave the alpha channel alone
          (srcAlpha·0 + dstAlpha·1 = dstAlpha = 1), so the disc stays fully
          opaque while the clouds still blend visually. */}
      <meshPhongMaterial
        color="#ffffff"
        alphaMap={cloudMap}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.SrcAlphaFactor}
        blendDst={THREE.OneMinusSrcAlphaFactor}
        blendEquationAlpha={THREE.AddEquation}
        blendSrcAlpha={THREE.ZeroFactor}
        blendDstAlpha={THREE.OneFactor}
      />
    </mesh>
  );
}
