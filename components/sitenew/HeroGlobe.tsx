'use client';

import { Stars } from '@react-three/drei';
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
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import Atmosphere from '@/components/celestial/Atmosphere';
import LoadingScreen from '@/components/celestial/LoadingScreen';
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Clouds from '@/components/earth/Clouds';
import Earth from '@/components/earth/Earth';
import { SUN_POSITION } from '@/lib/sun';

/**
 * A locked-down version of the product globe for the marketing hero. No
 * OrbitControls, no markers, no click handlers. Slow auto-rotation on the
 * earth+clouds group plus a tiny mouse-parallax tilt on the camera.
 */
function HeroScene() {
  const earthGroupRef = useRef<THREE.Group>(null);
  const targetMouse = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Camera distance ~2.85 — a 0.10 perpendicular offset is ~2° of tilt.
  const PARALLAX_X = 0.1;
  const PARALLAX_Y = 0.07;
  const BASE_X = 1.6;
  const BASE_Y = 0.5;
  const BASE_Z = 2.3;
  const LOOK_X = -0.4; // shifts the planet toward the right side of the frame

  useFrame((_, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += 0.04 * delta;
    }
    smoothedMouse.current.x = THREE.MathUtils.lerp(
      smoothedMouse.current.x,
      targetMouse.current.x,
      0.05
    );
    smoothedMouse.current.y = THREE.MathUtils.lerp(
      smoothedMouse.current.y,
      targetMouse.current.y,
      0.05
    );
    camera.position.set(
      BASE_X + smoothedMouse.current.x * PARALLAX_X,
      BASE_Y - smoothedMouse.current.y * PARALLAX_Y,
      BASE_Z
    );
    camera.lookAt(LOOK_X, 0, 0);
  });

  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);

  return (
    <>
      <SpaceGradient />
      <Stars
        radius={300}
        depth={60}
        count={4000}
        factor={2}
        saturation={0.3}
        fade
        speed={0.3}
      />
      <ShootingStar />

      <directionalLight
        position={SUN_POSITION}
        intensity={2.0}
        color="#fffaf0"
      />
      <ambientLight intensity={0.05} color="#1a2540" />

      <group ref={earthGroupRef}>
        <Earth />
        <Clouds />
      </group>
      <Atmosphere />

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
    </>
  );
}

export default function HeroGlobe() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
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
          <HeroScene />
        </Suspense>
      </Canvas>
      <LoadingScreen />
    </div>
  );
}
