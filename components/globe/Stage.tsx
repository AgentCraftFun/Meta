'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
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
        camera={{ position: [2.2, 0.8, 2.5], fov: 38, near: 0.01, far: 100 }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#000000', 1);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = SRGBColorSpace;
          scene.background = null;
        }}
      >
        <Suspense fallback={null}>
          <Globe />
        </Suspense>
      </Canvas>
      <Vignette />
      <LoadingScreen />
    </div>
  );
}

function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
      }}
    />
  );
}
