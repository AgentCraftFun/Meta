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
import BeaconField from './BeaconField';
import CameraRig from './CameraRig';
import HeroBeacon from './HeroBeacon';
import LightHeroFallback from './LightHeroFallback';
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
        setDpr(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1.75, 1.75));
        calmTimer.current = null;
      }, 180);
    }
  });
  return null;
}

function Scene({
  tier,
  frozen,
  simplified,
}: {
  tier: TextureTier;
  frozen: boolean;
  simplified: boolean;
}) {
  const earthGroupRef = useRef<THREE.Group>(null);

  return (
    <>
      {/* Transparent canvas: ONLY the globe sphere is rendered (no full-screen
          stars / space-gradient), so there is no rectangle to clip — the sphere
          is naturally circular and scales/moves cleanly. The page #05080F shows
          through everywhere else. */}
      <directionalLight position={SUN_POSITION} intensity={2.0} color="#fffaf0" />
      <ambientLight intensity={0.05} color="#1a2540" />

      <group ref={earthGroupRef}>
        <SceneEarth tier={tier} />
        <SceneClouds tier={tier} frozen={frozen} />
        <HeroBeacon lat={38} lng={-97} />
        <BeaconField simplified={simplified} frozen={frozen} />
      </group>
      {/* Stronger atmospheric rim to compensate for no bloom (bloom needs a
          composer, which breaks canvas transparency → rectangle). */}
      <Atmosphere intensity={2.6} />

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
  const simplified =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px)').matches;

  return (
    <div
      id="globe-stage"
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: z.earth, background: '#05080F' }}
    >
      <div
        id="globe-transform"
        className="absolute inset-0"
        style={{
          transformOrigin: 'center center',
          willChange: 'transform, filter, opacity',
        }}
      >
        <Canvas
          dpr={[1, 1.75]}
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
            gl.toneMappingExposure = 0.85;
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor(0x000000, 0); // transparent — page #05080F shows through
          }}
        >
          <Suspense fallback={null}>
            <Scene tier={tier} frozen={reduced} simplified={simplified} />
          </Suspense>
        </Canvas>
      </div>
      <LoadingScreen />
    </div>
  );
}
