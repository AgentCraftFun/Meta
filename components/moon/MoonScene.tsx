'use client';

import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';
import { applyMoonFilter } from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';
import Moon from './Moon';
import TokenFlags from './TokenFlags';

const MOON_ROTATION_RAD_S = 0.005;
const HOVER_RESUME_DELAY_MS = 2000;

/**
 * Phase F: claimed-surface moon. Top 30 tokens of the active filter are
 * planted on the moon's surface as flags. Moon body + flags rotate
 * together inside a single wrapper group so flags stay anchored. Hover
 * any flag to pause rotation; mouse-out resumes after 2s.
 */
export default function MoonScene() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const filter = useMetaStore((s) => s.moonFilter);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const { data } = useTokens(timeWindow);

  const filteredTokens = useMemo(
    () => applyMoonFilter(data?.tokens ?? [], filter),
    [data, filter]
  );

  // Rotation pause logic — paused while any flag is hovered, resumes 2s
  // after the hover clears. The timeout is held in a ref so a quick
  // re-hover cancels the pending resume.
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  useEffect(() => {
    if (hoveredTokenId) {
      if (resumeTimer.current !== null) {
        window.clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
      setPaused(true);
      return;
    }
    resumeTimer.current = window.setTimeout(() => {
      setPaused(false);
      resumeTimer.current = null;
    }, HOVER_RESUME_DELAY_MS);
    return () => {
      if (resumeTimer.current !== null) {
        window.clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
    };
  }, [hoveredTokenId]);

  return (
    <Stage
      camera={{ position: [0, 1.5, 2.8], fov: 35, near: 0.1, far: 600 }}
      loadingTitle="Initializing / Moon / Lunar orbit scan"
    >
      {/* Backdrop — same starfield as Earth so the universe feels continuous */}
      <SpaceGradient />
      <Starfield />
      <ShootingStar />

      {/* Lighting — harsh key, almost no fill */}
      <directionalLight position={[5, 2, 3]} intensity={2.5} color="#fffaf0" />
      <ambientLight intensity={0.08} color="#2a3550" />

      {/* Claimed surface: moon body + flags rotate together */}
      <ClaimedSurface
        paused={paused}
        filteredTokens={filteredTokens}
        filter={filter}
      />

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
      />

      {/* Postprocessing — bloom catches the cap dots + emissive pole rim */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.6}
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

/**
 * Wrapper that owns the per-frame rotation so the Moon mesh and the
 * TokenFlags layer rotate as one rigid body — flags stay welded to the
 * moon's surface even as it spins.
 */
function ClaimedSurface({
  paused,
  filteredTokens,
  filter,
}: {
  paused: boolean;
  filteredTokens: ReturnType<typeof applyMoonFilter>;
  filter: ReturnType<typeof useMetaStore.getState>['moonFilter'];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return;
    groupRef.current.rotation.y += MOON_ROTATION_RAD_S * delta;
  });

  return (
    <group ref={groupRef}>
      {/* Moon's internal rotation is disabled — wrapper drives the spin */}
      <Moon rotationSpeed={0} />
      <TokenFlags tokens={filteredTokens} filter={filter} />
    </group>
  );
}
