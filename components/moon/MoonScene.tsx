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
import { applyMoonFilter } from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { useEffectiveTokens } from '@/lib/useEffectiveTokens';
import Moon from './Moon';
import MoonCameraController from './MoonCameraController';
import TokenCraters from './TokenCraters';

const MOON_ROTATION_RAD_S = 0.005;
const HOVER_RESUME_DELAY_MS = 2000;

/**
 * World offset X for the moon group. Two states:
 *   - panel closed:  -0.15  (balanced between left HUD + right list)
 *   - panel open:    -0.45  (further left so the side panel doesn't
 *                            overlap the moon)
 * MoonScene lerps between these and also drives controls.target.x to
 * match so OrbitControls stays centred on the moon while it slides.
 */
export const MOON_X_CLOSED = -0.15;
export const MOON_X_OPEN = -0.45;

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
  const universe = useEffectiveTokens(timeWindow);

  const filteredTokens = useMemo(
    () => applyMoonFilter(universe, filter),
    [universe, filter]
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
      camera={{ position: [0, 0, 3.5], fov: 35, near: 0.1, far: 600 }}
      loadingTitle="Initializing / Moon / Lunar orbit scan"
    >
      {/* Backdrop — same starfield as Earth so the universe feels continuous */}
      <SpaceGradient />
      <Starfield />
      <ShootingStar />

      {/* Lighting — harsh key, gentle cool fill so the dark side reads */}
      <directionalLight position={[-5, 2, 3]} intensity={2.5} color="#fffaf0" />
      <ambientLight intensity={0.12} color="#3a4570" />

      {/* Claimed surface: moon body + craters rotate together, offset left */}
      <ClaimedSurface paused={paused} filteredTokens={filteredTokens} />

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
        target={[MOON_X_CLOSED, 0, 0]}
      />

      {/* Postprocessing — bloom catches HDR craters + light shafts */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.75}
          luminanceSmoothing={0.7}
          mipmapBlur
          radius={0.65}
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
}: {
  paused: boolean;
  filteredTokens: ReturnType<typeof applyMoonFilter>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const targetX = selectedTokenId ? MOON_X_OPEN : MOON_X_CLOSED;

  // Pull controls so we can drag its target alongside the moon's X.
  const { controls } = useThree() as { controls: any | null };

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Idle rotation
      if (!paused) groupRef.current.rotation.y += MOON_ROTATION_RAD_S * delta;

      // Cubic ease-in-out lerp on X. dt-scaled exponential lerp gives the
      // "feels like 600ms" character without bookkeeping a timer.
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
      <TokenCraters tokens={filteredTokens} />
    </group>
  );
}
