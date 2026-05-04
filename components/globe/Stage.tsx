'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Globe from './Globe';

export default function Stage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      {!mounted && <BootOverlay />}
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

function BootOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3 font-mono">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-neon-cyan/80">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
          Initializing MetaMap…
        </div>
      </div>
    </div>
  );
}
