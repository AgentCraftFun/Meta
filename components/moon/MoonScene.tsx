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
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';
import { applyMoonFilter, type MoonFilter } from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { useEffectiveTokens } from '@/lib/useEffectiveTokens';
import { useReducedMotion } from '@/lib/useReducedMotion';
import Moon from './Moon';
import MoonAtmosphericGlow from './MoonAtmosphericGlow';
import MoonCameraController from './MoonCameraController';
import TokenCraters from './TokenCraters';

const MOON_ROTATION_RAD_S = 0.005;
const HOVER_RESUME_DELAY_MS = 2000;

/**
 * World offset X for the moon group. Two states:
 *   - panel closed:  -0.15  (balanced between left HUD + right list)
 *   - panel open:    -0.45  (further left so the side panel doesn't
 *                            overlap the moon)
 */
export const MOON_X_CLOSED = -0.15;
export const MOON_X_OPEN = -0.45;

/**
 * Moon scene. Lighting is FIXED across all filters — the moon is a world
 * and the world isn't tinted by UI state. Filter changes only relocate
 * the data (craters), not the lighting; LOSERS lands on the dark side,
 * everything else lands on the lit side. The metaphor lives in placement.
 */
export default function MoonScene() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const filter = useMetaStore((s) => s.moonFilter);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const universe = useEffectiveTokens(timeWindow);

  const filteredTokens = useMemo(
    () => applyMoonFilter(universe, filter),
    [universe, filter]
  );

  const reducedMotion = useReducedMotion();

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
      camera={{ position: [0, 0, 3.5], fov: 35, near: 0.1, far: 600 }}
      exposure={0.92}
      loadingTitle="Initializing / Moon / Lunar orbit scan"
    >
      {/* Backdrop — same starfield as Earth so the universe feels continuous */}
      <SpaceGradient />
      <Starfield />
      <ShootingStar />

      {/* Fixed 5-light rig — identical for every filter. The moon is the
          world, not the UI. */}
      <directionalLight position={[5, 2, 3]} intensity={1.6} color="#fffaf0" />
      <directionalLight position={[4, 1.5, 2.5]} intensity={0.5} color="#fff5e0" />
      <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#4a90e2" />
      <directionalLight position={[0, 5, 0]} intensity={0.25} color="#5a7090" />
      <ambientLight intensity={0.22} color="#3a4570" />

      {/* Claimed surface: moon body + craters rotate together, offset left */}
      <ClaimedSurface
        paused={paused || reducedMotion}
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
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.15}
        target={[MOON_X_CLOSED, 0, 0]}
      />

      {/* Postprocessing — tight bloom so the moon body never blooms; only
          the HDR craters and shafts trigger it. */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.0}
          luminanceThreshold={0.78}
          luminanceSmoothing={0.6}
          mipmapBlur
          radius={0.75}
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
 * Wrapper that owns the per-frame rotation. Tagged with name="claimed-surface"
 * so MoonCameraController can resolve crater world positions through this
 * group's matrixWorld during click tweens.
 */
function ClaimedSurface({
  paused,
  filteredTokens,
  filter,
}: {
  paused: boolean;
  filteredTokens: ReturnType<typeof applyMoonFilter>;
  filter: MoonFilter;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const targetX = selectedTokenId ? MOON_X_OPEN : MOON_X_CLOSED;

  const { controls } = useThree() as { controls: any | null };

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (!paused) groupRef.current.rotation.y += MOON_ROTATION_RAD_S * delta;

      const k = 1 - Math.exp(-delta * 6);
      const cur = groupRef.current.position.x;
      const next = cur + (targetX - cur) * k;
      groupRef.current.position.x = next;
      if (controls) {
        controls.target.x = next;
      }
    }
  });

  return (
    <group ref={groupRef} name="claimed-surface" position={[MOON_X_CLOSED, 0, 0]}>
      <Moon rotationSpeed={0} />
      <MoonAtmosphericGlow />
      <TokenCraters tokens={filteredTokens} filter={filter} />
    </group>
  );
}
