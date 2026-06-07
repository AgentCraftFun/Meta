'use client';

import { AdaptiveDpr, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
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
import SpaceGradient from '@/components/celestial/SpaceGradient';
import { SUN_POSITION } from '@/lib/sun';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { z } from '../system/motion';
import CameraRig from './CameraRig';
import LightHeroFallback from './LightHeroFallback';
import SceneEarth from './SceneEarth';
import SceneClouds from './SceneClouds';
import { pickTextureTier, shouldUseFallback, type TextureTier } from './deviceTier';

/**
 * The persistent globe. ONE fixed canvas (z-0) behind the whole page. Reuses
 * the read-only celestial chrome (SpaceGradient, ShootingStar, Atmosphere) and
 * the product's bloom→hue→contrast→chromatic→vignette grade. The earth itself
 * uses the device-tiered optimized textures via <SceneEarth>/<SceneClouds>.
 *
 * Fallback (reduced-motion / mobile-low-power / no-WebGL) renders a static
 * non-WebGL frame instead — zero canvas, zero animation.
 *
 * PHASE 2: camera persists + rotates at waypoint 0. No scroll flight yet.
 */
function Scene({
  tier,
  frozen,
}: {
  tier: TextureTier;
  frozen: boolean;
}) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  return (
    <>
      <SpaceGradient />
      <Stars radius={300} depth={60} count={4000} factor={2} saturation={0.3} fade speed={0.3} />
      <ShootingStar />

      <directionalLight position={SUN_POSITION} intensity={2.0} color="#fffaf0" />
      <ambientLight intensity={0.05} color="#1a2540" />

      <group ref={earthGroupRef}>
        <SceneEarth tier={tier} />
        <SceneClouds tier={tier} frozen={frozen} />
      </group>
      <Atmosphere />

      <CameraRig earthGroupRef={earthGroupRef} frozen={frozen} />

      <EffectComposer multisampling={0}>
        <Bloom
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

  // SSR / first paint: render nothing (avoids hydration mismatch + lets us
  // read window for capability detection on the client only).
  if (!mounted) return null;

  if (shouldUseFallback(reduced)) {
    return <LightHeroFallback />;
  }

  const tier = pickTextureTier();

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: z.earth }}>
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
        }}
      >
        <Suspense fallback={null}>
          <Scene tier={tier} frozen={reduced} />
        </Suspense>
      </Canvas>
      <LoadingScreen />
    </div>
  );
}
