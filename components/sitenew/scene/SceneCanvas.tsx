'use client';

import { AdaptiveDpr } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import LoadingScreen from '@/components/celestial/LoadingScreen';
import { SUN_POSITION } from '@/lib/sun';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { z } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import CameraRig from './CameraRig';
import LightHeroFallback from './LightHeroFallback';
import SceneBeacons from './SceneBeacons';
import SceneEarth from './SceneEarth';
import SceneClouds from './SceneClouds';
import { pickTextureTier, shouldUseFallback, type TextureTier } from './deviceTier';

const FAST_SCROLL_THRESHOLD = 35;

/** Fast-scroll guard: above a velocity threshold cap DPR to 1; restore on
 *  settle (180ms calm). DPR only — the postprocessing stack is never toggled
 *  (scene internals stay fixed); the CSS-blur skip lives in the globe controller. */
function PerfGuard() {
  const setDpr = useThree((s) => s.setDpr);
  const fast = useRef(false);
  const calmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(() => {
    const v = Math.abs(useSceneStore.getState().scrollVelocity);
    if (v > FAST_SCROLL_THRESHOLD && !fast.current) {
      fast.current = true;
      setDpr(1);
      if (calmTimer.current) clearTimeout(calmTimer.current);
    } else if (v <= FAST_SCROLL_THRESHOLD && fast.current && !calmTimer.current) {
      calmTimer.current = setTimeout(() => {
        fast.current = false;
        setDpr(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2));
        calmTimer.current = null;
      }, 180);
    }
  });
  return null;
}

function Scene({
  tier,
  frozen,
}: {
  tier: TextureTier;
  frozen: boolean;
}) {
  const earthGroupRef = useRef<THREE.Group>(null);

  return (
    <>
      {/* Transparent canvas: ONLY the globe sphere is rendered (no full-screen
          stars / space-gradient), so there is no rectangle to clip — the sphere
          is naturally circular and scales/moves cleanly. The page #05080F shows
          through everywhere else. No surface beacons/pins — just the clean globe. */}
      <directionalLight position={SUN_POSITION} intensity={2.0} color="#fffaf0" />
      <ambientLight intensity={0.05} color="#1a2540" />

      <group ref={earthGroupRef}>
        <SceneEarth tier={tier} />
        <SceneClouds tier={tier} frozen={frozen} />
        {/* §3 surface beacons — rise from the globe only while it's in the
            Product panel; spin with the planet (children of this group). */}
        <SceneBeacons />
      </group>
      {/* Subtle atmospheric rim — kept light so the globe reads crisp (a strong
          rim hazes the silhouette and washes the surface). */}
      <Atmosphere />

      {/* Camera holds hero framing; the globe travels via the controller's
          canvas-layer transform + scroll-linked spin. */}
      <CameraRig earthGroupRef={earthGroupRef} frozen={frozen} lockFlight />
      <PerfGuard />

      <AdaptiveDpr pixelated={false} />
    </>
  );
}

export default function SceneCanvas() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (shouldUseFallback(reduced)) {
    return <LightHeroFallback />;
  }

  const tier = pickTextureTier();

  return (
    <div
      id="globe-stage"
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: z.earth, background: '#05080F' }}
    >
      {/* (Removed the z0 tactical grid: it lived in the same plane as the
          travelling globe and showed THROUGH every cutout around the bodies —
          the "see-through" glitch. The page bg is now a clean #05080F space, so
          every body reads as a solid disc on space, like /siteview.) */}
      <div
        id="globe-transform"
        className="absolute inset-0"
        style={{
          transformOrigin: 'center center',
          willChange: 'transform, filter, opacity',
        }}
      >
        <Canvas
          dpr={[1, 2]}
          // CRITICAL: measure the canvas with offsetWidth/Height (LAYOUT size,
          // unaffected by CSS transforms) instead of getBoundingClientRect.
          // #globe-transform is CSS-scaled per section; without this, R3F sized
          // the WebGL buffer to the *scaled* box and lagged behind the scale
          // change, making the globe jump/resize ~1s after each scroll. With
          // offsetSize the buffer stays a constant viewport size and the CSS
          // transform cleanly scales the globe once.
          resize={{ offsetSize: true }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
            stencil: false,
            depth: true,
          }}
          camera={{ position: [2.25, 0.7, 3.23], fov: 30, near: 0.1, far: 1000 }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.85; // match /siteview (richer clouds; earth is a raw shader, unaffected)
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor(0x000000, 0); // transparent — page #05080F shows through
          }}
        >
          <Suspense fallback={null}>
            <Scene tier={tier} frozen={reduced} />
          </Suspense>
        </Canvas>
      </div>
      <LoadingScreen />
    </div>
  );
}
