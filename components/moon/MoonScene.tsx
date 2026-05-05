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
import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';
import Moon from './Moon';
import OrbitTrails from './OrbitTrails';
import SelectionRing from './SelectionRing';
import TokenSatellites from './TokenSatellites';

/**
 * Phase D: hyperrealistic moon body + orbiting token satellites. The moon
 * setup (body, lights, backdrop) is unchanged from Phase B+C — satellites
 * are added alongside. Bloom is bumped to catch the HDR satellite spheres;
 * OrbitControls maxDistance is widened so the user can zoom out to the
 * full halo.
 */
export default function MoonScene() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0008), []);
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useTokens(window);
  const tokens = data?.tokens ?? [];

  return (
    <Stage
      camera={{ position: [0, 0, 3.5], fov: 35, near: 0.1, far: 600 }}
      loadingTitle="Initializing / Moon / Lunar orbit scan"
    >
      {/* Backdrop — same starfield as Earth so the universe feels continuous */}
      <SpaceGradient />
      <Starfield />
      <ShootingStar />

      {/* Lighting — harsh key, almost no fill */}
      <directionalLight position={[5, 2, 3]} intensity={2.5} color="#fffaf0" />
      <ambientLight intensity={0.08} color="#2a3550" />

      {/* Moon body */}
      <Moon />

      {/* Token halo */}
      <OrbitTrails tokens={tokens} />
      <TokenSatellites tokens={tokens} />
      <SelectionRing tokens={tokens} />

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
        maxDistance={16}
        autoRotate
        autoRotateSpeed={0.12}
      />

      {/* Postprocessing — bloom bumped so HDR satellites bloom; same colour
          grade as Earth so the surfaces feel like one universe. */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.6}
          mipmapBlur
          radius={0.7}
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
