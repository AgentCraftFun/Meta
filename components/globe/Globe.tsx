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
import CameraController from './CameraController';
import Clouds from './Clouds';
import Earth from './Earth';
import Markers from './Markers';
import NebulaBackground from './NebulaBackground';

export default function Globe() {
  return (
    <>
      {/* Procedural nebula sphere fills the background */}
      <NebulaBackground />

      {/* Sun from upper-right */}
      <directionalLight
        position={SUN_POSITION}
        intensity={2.0}
        color="#fffaf0"
      />
      {/* Just enough ambient to lift true black */}
      <ambientLight intensity={0.05} color="#1a2540" />

      {/* Denser, more varied stars */}
      <Stars
        radius={300}
        depth={60}
        count={8000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      <Earth />
      <Clouds />
      <Atmosphere />
      <Markers />
      <CameraController />

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

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.6}
          levels={7}
        />
        <HueSaturation hue={0} saturation={-0.05} />
        <BrightnessContrast brightness={-0.03} contrast={0.15} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </>
  );
}
