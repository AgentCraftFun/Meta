'use client';

import { AdaptiveDpr } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import { shouldUseFallback } from '@/components/sitenew/scene/deviceTier';
import SceneMars from '@/components/sitemars/scene/SceneMars';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Ambient backdrop for /MarsTracker: the REAL Mars — the same shader-graded
 * <SceneMars> body and warm <Atmosphere> rim used on /siteMARS, here in a
 * standalone, scroll-free canvas that simply auto-rotates. Camera + tone
 * mapping mirror /siteMARS exactly, so the colour grade is identical; only the
 * framing differs (a large planet "rising" from the lower half). A live frosted
 * console floats over it (its backdrop-filter refracts the spinning planet).
 *
 * Capability-gated: reduced-motion / mobile / no-WebGL fall back to a static
 * lightweight sphere (the 100KB downscaled texture) — no heavy WebGL load.
 */

// Backdrop globe uses a 4k texture (~880KB) — same grade as the 8k, far lighter.
const TRACKER_MARS_TEXTURE = '/textures/4k_mars.jpg';

// Deterministic star positions (index math, never Math.random) — SSR-safe.
const STARS = Array.from({ length: 64 }).map((_, i) => ({
  left: ((i * 47) % 100) + (i % 3) * 0.7,
  top: ((i * 71) % 100) + (i % 5) * 0.4,
  size: i % 11 === 0 ? 2 : 1,
  opacity: ((i * 17) % 70) / 100 + 0.18,
}));

function SpinningMars() {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    // Slow, majestic auto-rotation (~125s per revolution). delta is clamped so
    // a backgrounded tab doesn't jump the planet on refocus.
    if (spin.current) spin.current.rotation.y += Math.min(delta, 0.1) * 0.05;
  });
  return (
    // Placement group: large planet, dropped into the lower half, axis tilted
    // for a more dynamic read. The inner group carries the spin so the lit
    // hemisphere / terminator stay world-fixed while the surface turns.
    <group position={[0, -1.45, 0]} scale={1.6} rotation={[0.1, 0, 0.13]}>
      <group ref={spin}>
        <SceneMars texture={TRACKER_MARS_TEXTURE} />
      </group>
      <Atmosphere color={[1.0, 0.55, 0.4]} intensity={1.7} />
    </group>
  );
}

function GlobeCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 4.4], fov: 30, near: 0.1, far: 1000 }}
      onCreated={({ gl }) => {
        // EXACTLY /siteMARS's renderer config → identical colour grade.
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.85;
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor(0x000000, 0); // transparent — page space shows through
      }}
    >
      <Suspense fallback={null}>
        <SpinningMars />
        <AdaptiveDpr pixelated={false} />
      </Suspense>
    </Canvas>
  );
}

function StaticMars() {
  return (
    <>
      {/* Warm atmosphere bloom off the limb. */}
      <div
        className="absolute left-1/2 top-[72%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgb(var(--accent-400) / 0.28) 0%, rgb(var(--accent-400) / 0.08) 38%, transparent 65%)',
        }}
      />
      <div
        className="absolute left-1/2 top-[120%] h-[1180px] w-[1180px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundImage: 'url(/textures/mars_tracker_bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          boxShadow:
            'inset -70px -90px 200px rgba(0,0,0,0.9), inset 60px 40px 160px rgba(0,0,0,0.45), 0 0 140px rgb(var(--accent-400) / 0.22)',
        }}
      />
    </>
  );
}

export default function MarsStage() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // SSR + first client paint render the static branch (matches), then capable
  // devices upgrade to the live canvas after mount — no hydration mismatch.
  const use3D = mounted && !shouldUseFallback(reduced);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Starfield */}
      <div className="absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* The planet — live spinning 3D when capable, static sphere otherwise. */}
      {use3D ? (
        <div className="absolute inset-0">
          <GlobeCanvas />
        </div>
      ) : (
        <StaticMars />
      )}

      {/* Contrast vignette — darken the upper half (behind the headline) so the
          copy reads, while Mars stays vivid in the lower half where the frosted
          console floats over it. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #05080F 0%, rgba(5,8,15,0.6) 24%, rgba(5,8,15,0) 50%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 110% 78% at 50% 34%, rgba(5,8,15,0) 44%, rgba(5,8,15,0.55) 100%)',
        }}
      />
    </div>
  );
}
