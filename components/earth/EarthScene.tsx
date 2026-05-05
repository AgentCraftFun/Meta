'use client';

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';
import { useMetaStore } from '@/lib/store';
import { SUN_POSITION } from '@/lib/sun';
import BreakingShake from './BreakingShake';
import CameraController from './CameraController';
import Clouds from './Clouds';
import Earth from './Earth';
import Markers from './Markers';

/**
 * World offset X for the earth group. Two states:
 *   - panel closed:  -0.15  (slight left to balance left HUD + right list)
 *   - panel open:    -0.45  (further left so the side panel doesn't
 *                            overlap the globe)
 * EarthScene lerps between these and also drives controls.target.x to
 * match so OrbitControls stays centred on the earth while it slides.
 */
export const EARTH_X_CLOSED = -0.15;
export const EARTH_X_OPEN = -0.45;

/**
 * Full Earth scene: backdrop layers, lighting, planet + atmosphere, narrative
 * markers, OrbitControls, and the post-processing chain.
 */
export default function EarthScene() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  return (
    <Stage>
      {/* 1. Background gradient sphere — fills the void */}
      <SpaceGradient />

      {/* 2. Sparse starfield + occasional shooting star */}
      <Starfield />
      <ShootingStar />

      {/* 3. Lights at world origin (directional → infinite, position is
              direction). The earth body itself is offset; lights stay put. */}
      <directionalLight
        position={SUN_POSITION}
        intensity={2.0}
        color="#fffaf0"
      />
      <ambientLight intensity={0.05} color="#1a2540" />

      {/* 4. Earth + clouds + atmosphere + markers grouped so the whole
              planet can slide left when the side panel opens. */}
      <EarthGroup />

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
        target={[EARTH_X_CLOSED, 0, 0]}
      />

      {/* 5. Postprocessing — tight bloom + cool grade */}
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

/**
 * Earth + clouds + atmosphere + markers, wrapped so the whole planet can
 * lerp left when the right side panel opens. Tagged name="earth-group" so
 * CameraController can resolve world positions through this group's
 * matrixWorld during click tweens.
 */
function EarthGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const targetX = selectedCountry ? EARTH_X_OPEN : EARTH_X_CLOSED;

  const { controls } = useThree() as { controls: any | null };

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Cubic-feeling exponential lerp; ~600ms perceived settle.
    const k = 1 - Math.exp(-delta * 6);
    const cur = groupRef.current.position.x;
    const next = cur + (targetX - cur) * k;
    groupRef.current.position.x = next;
    if (controls) {
      // Only nudge target.x; rotation + zoom logic still respect user input
      // on the other axes.
      controls.target.x = next;
    }
  });

  return (
    <group ref={groupRef} name="earth-group" position={[EARTH_X_CLOSED, 0, 0]}>
      <Earth />
      <Clouds />
      <Atmosphere />
      <Markers />
    </group>
  );
}
