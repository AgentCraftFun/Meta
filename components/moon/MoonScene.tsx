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
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';
import Moon from './Moon';

/**
 * Phase B: hyperrealistic 3D moon. One harsh key light and a faint cool
 * ambient — no rim fill, no atmosphere — so the moon reads as a lonely
 * dusty body in deep space. Bloom is dialled way back vs Earth since
 * there are no city lights or specular oceans for it to catch.
 */
export default function MoonScene() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  return (
    <Stage
      camera={{ position: [0, 0, 3.5], fov: 35, near: 0.1, far: 600 }}
    >
      {/* Backdrop — same starfield as Earth so the universe feels continuous */}
      <SpaceGradient />
      <Starfield />
      <ShootingStar />

      {/* Lighting — harsh key, almost no fill */}
      <directionalLight position={[5, 2, 3]} intensity={2.5} color="#fffaf0" />
      <ambientLight intensity={0.02} color="#1a2540" />

      {/* Moon body */}
      <Moon />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minDistance={1.6}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.12}
      />

      {/* Postprocessing — Bloom dialled way back, same colour grade as
          Earth so the surfaces feel like one universe */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.6}
          levels={6}
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
