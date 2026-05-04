'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import Globe from './Globe';
import LoadingScreen from './LoadingScreen';

export default function Stage() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [1.0, 0.5, 2.2], fov: 38, near: 0.1, far: 600 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.85;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}>
          <Globe />
        </Suspense>
      </Canvas>
      <LoadingScreen />
    </div>
  );
}
