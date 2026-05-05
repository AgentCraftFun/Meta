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
import MoonCameraController from './MoonCameraController';
import TokenFlags from './TokenFlags';

const MOON_ROTATION_RAD_S = 0.005;
const HOVER_RESUME_DELAY_MS = 2000;

/** World offset for the moon group so it sits visually between the
 *  280px left HUD and the 360px right list. */
export const MOON_OFFSET = new THREE.Vector3(-0.15, 0, 0);

/**
 * Phase F polish: claimed-surface moon. Top 30 tokens of the active
 * filter are planted on the moon's surface as flags. Moon body + flags
 * rotate together inside a single wrapper group so flags stay anchored.
 * Hovering or selecting any flag pauses rotation. The whole group is
 * offset slightly left of origin to balance the dual-sidebar layout.
 */
export default function MoonScene() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const filter = useMetaStore((s) => s.moonFilter);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const { data } = useTokens(timeWindow);

  const filteredTokens = useMemo(
    () => applyMoonFilter(data?.tokens ?? [], filter),
    [data, filter]
  );

  // Rotation paused while a flag is hovered OR selected. A 2s grace
  // period after the last hover clears prevents jitter on quick
  // mouse-overs.
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const lockedBySelection = !!selectedTokenId;
  useEffect(() => {
    if (lockedBySelection || hoveredTokenId) {
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
  }, [hoveredTokenId, lockedBySelection]);

  return (
    <Stage
      camera={{ position: [0, 1.5, 2.8], fov: 35, near: 0.1, far: 600 }}
      loadingTitle="Initializing / Moon / Lunar orbit scan"
    >
      {/* Backdrop — same starfield as Earth so the universe feels continuous */}
      <SpaceGradient />
      <Starfield />
      <ShootingStar />

      {/* Lighting — harsh key, gentle cool fill so the dark side reads */}
      <directionalLight position={[5, 2, 3]} intensity={2.5} color="#fffaf0" />
      <ambientLight intensity={0.12} color="#3a4570" />

      {/* Claimed surface: moon body + flags rotate together, offset left */}
      <ClaimedSurface
        paused={paused}
        filteredTokens={filteredTokens}
        filter={filter}
      />

      {/* Camera tween on flag click */}
      <MoonCameraController />

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
        target={MOON_OFFSET}
      />

      {/* Postprocessing — bloom catches HDR caps + filter accents */}
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
 * Wrapper that owns the per-frame rotation. Tagged with name="claimed-surface"
 * so MoonCameraController can resolve flag world positions through this
 * group's matrixWorld during click tweens.
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
    <group ref={groupRef} name="claimed-surface" position={MOON_OFFSET}>
      <Moon rotationSpeed={0} />
      <TokenFlags tokens={filteredTokens} filter={filter} />
    </group>
  );
}
