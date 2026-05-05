'use client';

import { OrbitControls } from '@react-three/drei';
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useMemo } from 'react';
import * as THREE from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';
import { SUN_POSITION } from '@/lib/sun';
import BreakingShake from './BreakingShake';
import CameraController from './CameraController';
import Clouds from './Clouds';
import Earth from './Earth';
import Markers from './Markers';

/**
 * Full Earth scene: backdrop layers, lighting, planet + atmosphere, narrative
 * markers, OrbitControls, and the post-processing chain. Wraps everything in
 * the generic <Stage /> so the page just imports this one component.
 */
export default function EarthScene() {
  // Stable offset reference so ChromaticAberration doesn't see a "new" prop
  // each render and re-bind its uniform/effect chain.
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  return (
    <Stage>
      {/* 1. Background gradient sphere — fills the void */}
      <SpaceGradient />

      {/* 2. Sparse, lonely starfield in front of the gradient */}
      <Starfield />

      {/* 2b. Occasional shooting star — every 60-90s */}
      <ShootingStar />

      {/* 3. Lights, planet, atmosphere, markers */}
      <directionalLight
        position={SUN_POSITION}
        intensity={2.0}
        color="#fffaf0"
      />
      <ambientLight intensity={0.05} color="#1a2540" />

      <Earth />
      <Clouds />
      <Atmosphere />
      <Markers />
      <CameraController />
      <BreakingShake />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minDistance={1.8}
        maxDistance={5}
        autoRotate
        autoRotateSpeed={0.15}
      />

      {/* 4. Postprocessing — tight bloom + cool grade */}
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
    </Stage>
  );
}
