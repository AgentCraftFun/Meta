'use client';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { latLngToVec3, surfaceQuaternion } from '@/lib/geo';
import type { Narrative } from '@/lib/types';
import MarkerCard from './MarkerCard';

export type CountryGroup = {
  iso: string;
  name: string;
  lat: number;
  lng: number;
  top: Narrative;
  total: number;
};

type Props = {
  group: CountryGroup;
  selected: boolean;
  dimmed: boolean;
  onClick: (iso: string) => void;
};

const HOT_COLOR = new THREE.Color(1.0, 0.25, 0.15);
const WHITE_COLOR = new THREE.Color(0.95, 0.95, 1.0);
const COOL_COLOR = new THREE.Color(0.3, 0.6, 1.0);

function heatColorFor(n: Narrative): THREE.Color {
  if (n.category === 'breaking' || n.momentum > 0.7) return HOT_COLOR.clone();
  if (n.momentum < -0.2) return COOL_COLOR.clone();
  return WHITE_COLOR.clone();
}

const RING_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RING_FRAG = /* glsl */ `
  uniform float time;
  uniform float intensity;
  uniform vec3 heatColor;
  varying vec2 vUv;

  void main() {
    float dist = length(vUv - 0.5) * 2.0;

    // Animated radar pulse moving outward
    float pulse = sin(time * 2.5 - dist * 8.0) * 0.5 + 0.5;
    pulse = pow(pulse, 2.0);

    // Soft ring band
    float ring = smoothstep(0.30, 0.50, dist) * (1.0 - smoothstep(0.85, 1.0, dist));

    float alpha = ring * pulse * intensity;
    gl_FragColor = vec4(heatColor, alpha);
  }
`;

const BEAM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAG = /* glsl */ `
  uniform float time;
  uniform float intensity;
  uniform vec3 heatColor;
  varying vec2 vUv;

  void main() {
    // Bright at base, fading toward top
    float verticalFade = pow(1.0 - vUv.y, 1.5);
    // Bright in centre, soft edges (volumetric look on a low-poly cylinder)
    float horizontalFade = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0);
    // Subtle vertical energy bands flowing upward
    float energyFlow = sin(vUv.y * 20.0 - time * 3.0) * 0.15 + 0.85;
    // Gentle whole-beam pulse
    float pulse = sin(time * 2.0) * 0.2 + 0.8;

    float alpha = verticalFade * horizontalFade * energyFlow * pulse * intensity * 2.0;
    gl_FragColor = vec4(heatColor, alpha);
  }
`;

const CLICK_SPIKE_MS = 500;

function NarrativeMarkerImpl({ group, selected, dimmed, onClick }: Props) {
  const { iso, name, lat, lng, top } = group;
  const [hovered, setHovered] = useState(false);
  const clickSpikeAt = useRef(0);
  const { camera } = useThree();

  const heatColor = useMemo(() => heatColorFor(top), [top]);
  const surfacePos = useMemo(() => latLngToVec3(lat, lng, 1), [lat, lng]);
  const orientation = useMemo(() => surfaceQuaternion(lat, lng), [lat, lng]);
  const surfaceNormal = useMemo(() => surfacePos.clone().normalize(), [surfacePos]);

  const baseIntensity = 0.4 + (top.volume / 100) * 0.6;
  const beamHeight = 0.08 + (top.volume / 100) * 0.15;

  // Imperative materials so we can mutate uniforms without recompiling.
  const ringMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        intensity: { value: baseIntensity },
        heatColor: { value: heatColor.clone() },
      },
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beamMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        intensity: { value: baseIntensity },
        heatColor: { value: heatColor.clone() },
      },
      vertexShader: BEAM_VERT,
      fragmentShader: BEAM_FRAG,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Sync heat color when narrative shifts category/momentum.
  useEffect(() => {
    ringMat.uniforms.heatColor.value.copy(heatColor);
    beamMat.uniforms.heatColor.value.copy(heatColor);
    if (coreMatRef.current) coreMatRef.current.color.copy(heatColor);
  }, [heatColor, ringMat, beamMat]);

  // One module-scoped scratch vector reused per frame.
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Backside fade — markers behind the planet drop to ~0.
    camera.getWorldPosition(camDir).normalize();
    const facing = surfaceNormal.dot(camDir);
    const visibility = THREE.MathUtils.smoothstep(facing, -0.05, 0.2);

    // Click spike — peaks at 2x at the moment of click, decays linearly.
    let spike = 1;
    const since = performance.now() - clickSpikeAt.current;
    if (since < CLICK_SPIKE_MS) {
      spike = 1 + (1 - since / CLICK_SPIKE_MS);
    }

    const hoverMul = hovered ? 1.5 : 1;
    const dimMul = dimmed && !selected ? 0.4 : 1;

    const i = baseIntensity * hoverMul * spike * dimMul * visibility;

    ringMat.uniforms.time.value = t;
    ringMat.uniforms.intensity.value = i;
    beamMat.uniforms.time.value = t;
    beamMat.uniforms.intensity.value = i;
    if (coreMatRef.current) {
      coreMatRef.current.opacity = Math.min(
        1,
        0.9 * visibility * dimMul * hoverMul * spike
      );
    }
  });

  const showCard = hovered || selected;

  return (
    <group
      position={surfacePos}
      quaternion={orientation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        clickSpikeAt.current = performance.now();
        onClick(iso);
      }}
    >
      {/* Surface ring — radar ping at the country centroid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.005, 0.018, 32]} />
        <primitive object={ringMat} attach="material" />
      </mesh>

      {/* Vertical light beam */}
      <mesh position={[0, beamHeight / 2, 0]}>
        <cylinderGeometry
          args={[0.0005, 0.002, beamHeight, 12, 1, true]}
        />
        <primitive object={beamMat} attach="material" />
      </mesh>

      {/* Bright core sphere — the bloom emitter */}
      <mesh position={[0, 0.002, 0]}>
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshBasicMaterial
          ref={coreMatRef}
          color={heatColor}
          transparent
          opacity={0.9}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {showCard && (
        <Html
          position={[0, beamHeight + 0.012, 0]}
          distanceFactor={1.2}
          zIndexRange={[40, 0]}
          occlude={false}
          center={false}
          style={{ pointerEvents: 'none' }}
        >
          <MarkerCard
            iso={iso}
            name={name}
            narrative={top}
            colorHex={`#${heatColor.getHexString()}`}
            totalForCountry={group.total}
          />
        </Html>
      )}
    </group>
  );
}

const NarrativeMarker = memo(NarrativeMarkerImpl, (prev, next) => {
  if (prev.selected !== next.selected) return false;
  if (prev.dimmed !== next.dimmed) return false;
  if (prev.onClick !== next.onClick) return false;
  const a = prev.group;
  const b = next.group;
  if (a.iso !== b.iso) return false;
  if (a.total !== b.total) return false;
  if (a.top.id !== b.top.id) return false;
  if (a.top.volume !== b.top.volume) return false;
  if (a.top.category !== b.top.category) return false;
  if (a.top.momentum !== b.top.momentum) return false;
  return true;
});

export default NarrativeMarker;
