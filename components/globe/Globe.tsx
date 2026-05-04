'use client';

import { OrbitControls, Stars } from '@react-three/drei';
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { SUN_POSITION } from '@/lib/sun';
import Atmosphere from './Atmosphere';
import Clouds from './Clouds';
import Earth from './Earth';

export default function Globe() {
  return (
    <>
      {/* Background — barely-blue near-black, not pure black */}
      <color attach="background" args={['#000308']} />

      {/* 3-point cinematic lighting */}
      <directionalLight
        position={SUN_POSITION}
        intensity={1.8}
        color="#fff5e6"
      />
      <ambientLight intensity={0.02} color="#1a1a2e" />
      <directionalLight
        position={[-3, -1, -2]}
        intensity={0.15}
        color="#4a90e2"
      />

      {/* Sparse, larger stars — fewer but more cinematic */}
      <Stars
        radius={50}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />

      <Earth />
      <Clouds />
      <Atmosphere />

      <OrbitControls
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

      <EffectComposer multisampling={0}>
        {/* Aggressive bloom — needed to compensate for 0.6 exposure */}
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.7}
          mipmapBlur
          radius={0.85}
          levels={9}
        />
        {/* Color grading */}
        <HueSaturation hue={0} saturation={-0.05} />
        <BrightnessContrast brightness={-0.03} contrast={0.15} />
        {/* Lens chromatic aberration */}
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        {/* Cinematic framing */}
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </>
  );
}
