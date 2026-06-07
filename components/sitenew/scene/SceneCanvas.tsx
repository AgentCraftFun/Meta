'use client';

import { AdaptiveDpr, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import LoadingScreen from '@/components/celestial/LoadingScreen';
import ShootingStar from '@/components/celestial/ShootingStar';
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
import { INSIGHT_SECTION } from './waypoints';
import { SLOTS, clipCircle } from './globeSlots';
import { pickTextureTier, shouldUseFallback, type TextureTier } from './deviceTier';

const FAST_SCROLL_THRESHOLD = 35;

/** Eases bloom 0.9 → 1.3 during the Insight descent, back out afterwards. */
function BloomController({ bloomRef }: { bloomRef: React.MutableRefObject<{ intensity: number } | null> }) {
  useFrame((_, delta) => {
    const b = bloomRef.current;
    if (!b) return;
    const target = useSceneStore.getState().activeSection === INSIGHT_SECTION ? 1.3 : 0.9;
    b.intensity = THREE.MathUtils.damp(b.intensity, target, 3, Math.min(delta, 0.05));
  });
  return null;
}

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
  const bloomRef = useRef<{ intensity: number } | null>(null);
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  return (
    <>
      {/* No SpaceGradient: the canvas clears to #05080F (page colour) so the
          clip-path circle edge is invisible against the page. */}
      <Stars radius={300} depth={60} count={4000} factor={2} saturation={0.3} fade speed={0.3} />
      <ShootingStar />

      <directionalLight position={SUN_POSITION} intensity={2.0} color="#fffaf0" />
      <ambientLight intensity={0.05} color="#1a2540" />

      <group ref={earthGroupRef}>
        <SceneEarth tier={tier} />
        <SceneClouds tier={tier} frozen={frozen} />
        <HeroBeacon lat={38} lng={-97} />
        <BeaconField simplified={simplified} frozen={frozen} />
      </group>
      <Atmosphere />

      {/* Camera holds hero framing; the globe now travels via the
          GlobeStageController's canvas-layer transform, not camera flight. */}
      <CameraRig earthGroupRef={earthGroupRef} frozen={frozen} lockFlight />
      <BloomController bloomRef={bloomRef} />
      <PerfGuard />

      {/* Postprocessing stack is fixed (never toggled) — keeps the globe crisp
          and consistent; fast-scroll only caps DPR. */}
      <EffectComposer multisampling={0}>
        <Bloom
          ref={bloomRef as never}
          intensity={0.9}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.65}
          levels={7}
        />
        <HueSaturation hue={0} saturation={-0.05} />
        <BrightnessContrast brightness={-0.03} contrast={0.15} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={caOffset}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>

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

  // Default clip = hero (full-bleed). The controller updates it per slot so
  // scaled-down slots become clean circular discs (no star-rectangle).
  const defaultClip = clipCircle(SLOTS[0].feather);

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
          clipPath: defaultClip,
          WebkitClipPath: defaultClip,
        }}
      >
        <Canvas
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false,
            stencil: false,
            depth: true,
          }}
          camera={{ position: [1.6, 0.5, 2.3], fov: 30, near: 0.1, far: 1000 }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.85;
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor('#05080F', 1); // match the page so the clip edge is seamless
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
