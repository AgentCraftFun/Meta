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
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';
import { applyMoonFilter, type MoonFilter } from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';
import { useEffectiveTokens } from '@/lib/useEffectiveTokens';
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
 * Per-filter lighting preset. The key + fill directional lights, ambient
 * floor, and the moon's emissive tint are tweened toward the active
 * filter's preset so the room feels "lit by the narrative" — losers
 * darker and cooler, gainers warm-clean, hot blazing red, etc. Camera
 * does NOT move; this is purely a lighting story.
 */
type LightPreset = {
  keyPosition: [number, number, number];
  keyColor: string;
  keyIntensity: number;
  fillPosition: [number, number, number];
  fillColor: string;
  fillIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  emissive: string;
};

const LIGHT_PRESETS: Record<MoonFilter, LightPreset> = {
  trending: {
    keyPosition: [5, 2, 3],
    keyColor: '#fffaf0',
    keyIntensity: 2.0,
    fillPosition: [-4, -1, -3],
    fillColor: '#4a90e2',
    fillIntensity: 0.6,
    ambientColor: '#3a4570',
    ambientIntensity: 0.25,
    emissive: '#4a5570',
  },
  hot: {
    keyPosition: [4, 1.5, 3.5],
    keyColor: '#ffb088',
    keyIntensity: 2.4,
    fillPosition: [-4, -1, -2],
    fillColor: '#ff5a3c',
    fillIntensity: 0.75,
    ambientColor: '#5a2a3a',
    ambientIntensity: 0.28,
    emissive: '#5a3540',
  },
  new: {
    keyPosition: [3.5, 3, 4],
    keyColor: '#ffe6a0',
    keyIntensity: 2.2,
    fillPosition: [-3, -2, -3],
    fillColor: '#fbbf24',
    fillIntensity: 0.55,
    ambientColor: '#4a4030',
    ambientIntensity: 0.26,
    emissive: '#4f4830',
  },
  gainers: {
    keyPosition: [5, 2.5, 3],
    keyColor: '#f0fff4',
    keyIntensity: 2.1,
    fillPosition: [-4, -1, -3],
    fillColor: '#34d399',
    fillIntensity: 0.6,
    ambientColor: '#2f4a40',
    ambientIntensity: 0.26,
    emissive: '#3a5550',
  },
  losers: {
    keyPosition: [-5, 1.5, 3],
    keyColor: '#a4b8d4',
    keyIntensity: 1.5,
    fillPosition: [4, -1.5, -3],
    fillColor: '#5a6878',
    fillIntensity: 0.5,
    ambientColor: '#1f2838',
    ambientIntensity: 0.22,
    emissive: '#2a3548',
  },
};

const LIGHT_TWEEN_K = 4; // exponential lerp rate; ~800ms feel

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

  // Single shared ref to the moon's material so FilterLighting can tween
  // emissive alongside the directional/ambient lights.
  const moonMatRef = useRef<THREE.Material | null>(null);

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

      {/* Filter-driven five-light rig + tween. */}
      <FilterLighting filter={filter} moonMatRef={moonMatRef} />

      {/* Claimed surface: moon body + craters rotate together, offset left */}
      <ClaimedSurface
        paused={paused}
        filteredTokens={filteredTokens}
        filter={filter}
        moonMatRef={moonMatRef}
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
 * Five-light rig + per-frame tween toward the active filter's preset.
 *   key        — primary shape, warm/cool per filter
 *   fill       — opposite-side accent, lifts the back hemisphere
 *   rim        — behind the moon, separates silhouette from starfield
 *   ambient    — global floor so no pixel goes pitch-dark
 *   hemi       — sky/ground hemispheric tint, adds tonal depth in shadows
 */
function FilterLighting({
  filter,
  moonMatRef,
}: {
  filter: MoonFilter;
  moonMatRef: MutableRefObject<THREE.Material | null>;
}) {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  // Stable working colour / vector instances we mutate each frame.
  const work = useRef({
    keyColor: new THREE.Color(LIGHT_PRESETS.trending.keyColor),
    fillColor: new THREE.Color(LIGHT_PRESETS.trending.fillColor),
    ambientColor: new THREE.Color(LIGHT_PRESETS.trending.ambientColor),
    emissive: new THREE.Color(LIGHT_PRESETS.trending.emissive),
    keyPos: new THREE.Vector3(...LIGHT_PRESETS.trending.keyPosition),
    fillPos: new THREE.Vector3(...LIGHT_PRESETS.trending.fillPosition),
    targetKeyColor: new THREE.Color(),
    targetFillColor: new THREE.Color(),
    targetAmbient: new THREE.Color(),
    targetEmissive: new THREE.Color(),
    targetKeyPos: new THREE.Vector3(),
    targetFillPos: new THREE.Vector3(),
  });

  useFrame((_, delta) => {
    const preset = LIGHT_PRESETS[filter];
    const k = 1 - Math.exp(-delta * LIGHT_TWEEN_K);
    const w = work.current;

    w.targetKeyPos.set(...preset.keyPosition);
    w.targetFillPos.set(...preset.fillPosition);
    w.targetKeyColor.set(preset.keyColor);
    w.targetFillColor.set(preset.fillColor);
    w.targetAmbient.set(preset.ambientColor);
    w.targetEmissive.set(preset.emissive);

    w.keyPos.lerp(w.targetKeyPos, k);
    w.fillPos.lerp(w.targetFillPos, k);
    w.keyColor.lerp(w.targetKeyColor, k);
    w.fillColor.lerp(w.targetFillColor, k);
    w.ambientColor.lerp(w.targetAmbient, k);
    w.emissive.lerp(w.targetEmissive, k);

    if (keyRef.current) {
      keyRef.current.position.copy(w.keyPos);
      keyRef.current.color.copy(w.keyColor);
      keyRef.current.intensity += (preset.keyIntensity - keyRef.current.intensity) * k;
    }
    if (fillRef.current) {
      fillRef.current.position.copy(w.fillPos);
      fillRef.current.color.copy(w.fillColor);
      fillRef.current.intensity += (preset.fillIntensity - fillRef.current.intensity) * k;
    }
    if (ambientRef.current) {
      ambientRef.current.color.copy(w.ambientColor);
      ambientRef.current.intensity +=
        (preset.ambientIntensity - ambientRef.current.intensity) * k;
    }

    const mat = moonMatRef.current as THREE.MeshStandardMaterial | null;
    if (mat?.emissive) {
      mat.emissive.copy(w.emissive);
    }
  });

  return (
    <>
      <directionalLight ref={keyRef} position={[5, 2, 3]} intensity={2.0} color="#fffaf0" />
      <directionalLight ref={fillRef} position={[-4, -1, -3]} intensity={0.6} color="#4a90e2" />
      {/* Rim from behind separates the moon's silhouette from the starfield. */}
      <directionalLight position={[0, 0.5, -5]} intensity={0.35} color="#7a8aa8" />
      <ambientLight ref={ambientRef} intensity={0.25} color="#3a4570" />
      <hemisphereLight args={['#5a6c8a', '#1a1f2e', 0.18]} />
    </>
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
  moonMatRef,
}: {
  paused: boolean;
  filteredTokens: ReturnType<typeof applyMoonFilter>;
  filter: MoonFilter;
  moonMatRef: MutableRefObject<THREE.Material | null>;
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
      <Moon rotationSpeed={0} materialRef={moonMatRef} />
      <MoonAtmosphericGlow />
      <TokenCraters tokens={filteredTokens} filter={filter} />
    </group>
  );
}
