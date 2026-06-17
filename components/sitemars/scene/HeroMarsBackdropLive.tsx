'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import { z } from '@/components/sitenew/system/motion';
import { SUN_POSITION } from '@/lib/sun';
import SceneMars from './SceneMars';

/**
 * MOBILE hero globe — a self-contained, LIVE 3D Mars used instead of the static
 * LightHeroFallbackMars on capable phones.
 *
 * Unlike the desktop travelling stage (one fixed globe that snap-scroll slides
 * from section to section), this does NOT travel: it's a fixed backdrop parked
 * to the right (matching the static frame's composition) that spins gently and
 * FADES OUT across the first screen of scroll, so it never floats over the
 * content sections below. That sidesteps the whole desktop-only snap system.
 *
 * One canvas, the lighter 4k Mars texture, capped DPR — light enough for a
 * modern phone. Only mounted on capable mobiles (see SceneCanvasMars's gate);
 * reduced-motion / low-power / no-WebGL keep the static frame.
 */

function SpinningMars() {
  const ref = useRef<THREE.Group>(null);
  // Gentle ambient spin (the desktop spin is driven by the travel controller,
  // which isn't running here).
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 1 / 30) * 0.05;
  });
  return (
    <group ref={ref} rotation={[0.3, 0, 0.06]}>
      {/* 4k (not 8k) texture — far lighter on mobile memory. */}
      <SceneMars texture="/textures/4k_mars.jpg" />
    </group>
  );
}

export default function HeroMarsBackdropLive() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Fade the globe out across the first viewport so it's a HERO feature, not a
  // permanent backdrop spinning behind every section.
  useEffect(() => {
    if (!mounted) return;
    const el = wrapRef.current;
    if (!el) return;
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      const t = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85)));
      el.style.opacity = (0.72 * (1 - t)).toFixed(3);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: z.earth, background: '#05080F', opacity: 0.72 }}
    >
      <div
        className="absolute"
        style={{
          right: '-12%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 'min(86vh, 92vw)',
          height: 'min(86vh, 92vw)',
        }}
      >
        <Canvas
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            depth: true,
            stencil: false,
          }}
          camera={{ position: [0, 0, 3.8], fov: 30, near: 0.1, far: 1000 }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.85;
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor(0x000000, 0); // transparent — page #05080F shows through
          }}
        >
          <Suspense fallback={null}>
            <directionalLight position={SUN_POSITION} intensity={2.0} color="#fffaf0" />
            <ambientLight intensity={0.05} color="#1a2540" />
            <SpinningMars />
            <Atmosphere color={[1.0, 0.55, 0.4]} intensity={1.6} />
          </Suspense>
        </Canvas>
      </div>
      {/* vertical grade — keeps the hero copy legible over the planet. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5,8,15,0) 45%, rgba(5,8,15,0.6) 100%)',
        }}
      />
    </div>
  );
}
