'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function Clouds() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudMap = useTexture('/textures/8k_earth_clouds.jpg');
  cloudMap.colorSpace = THREE.NoColorSpace;
  cloudMap.anisotropy = 8;

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.015 * delta;
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
