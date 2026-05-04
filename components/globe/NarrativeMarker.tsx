'use client';

import { Billboard, Html } from '@react-three/drei';
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

type HeatLevel = 'hot' | 'warm' | 'emerging';

type HeatConfig = {
  color: THREE.Color;
  coreColor: THREE.Color;
  beamHeight: number;
  beamRadius: number;
  pulseSpeed: number;
  intensity: number;
  coreSize: number;
  showFlare: boolean;
};

function getHeatLevel(n: Narrative): HeatLevel {
  if (n.category === 'breaking' || n.momentum > 0.6) return 'hot';
  if (n.volume > 50 || n.momentum > 0.2) return 'warm';
  return 'emerging';
}

const HEAT_CONFIG: Record<HeatLevel, HeatConfig> = {
  hot: {
    color: new THREE.Color(1.0, 0.15, 0.1),
    coreColor: new THREE.Color(1.5, 0.3, 0.2),
    beamHeight: 0.28,
    beamRadius: 0.0035,
    pulseSpeed: 4.5,
    intensity: 1.4,
    coreSize: 0.012,
    showFlare: true,
  },
  warm: {
    color: new THREE.Color(1.0, 0.7, 0.1),
    coreColor: new THREE.Color(1.4, 1.0, 0.15),
    beamHeight: 0.18,
    beamRadius: 0.0022,
    pulseSpeed: 2.8,
    intensity: 1.0,
    coreSize: 0.009,
    showFlare: false,
  },
  emerging: {
    color: new THREE.Color(0.95, 0.95, 1.0),
    coreColor: new THREE.Color(1.2, 1.2, 1.4),
    beamHeight: 0.10,
    beamRadius: 0.0015,
    pulseSpeed: 1.6,
    intensity: 0.7,
    coreSize: 0.006,
    showFlare: false,
  },
};

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
  uniform float pulseSpeed;
  uniform vec3 heatColor;
  varying vec2 vUv;

  void main() {
    float dist = length(vUv - 0.5) * 2.0;

    float pulse = sin(time * pulseSpeed - dist * 8.0) * 0.5 + 0.5;
    pulse = pow(pulse, 2.0);

    float ring = smoothstep(0.30, 0.50, dist) * (1.0 - smoothstep(0.85, 1.0, dist));

    float alpha = ring * pulse * intensity * 1.8;
    // HDR colour so bloom catches the ring edge.
    gl_FragColor = vec4(heatColor * 1.3, alpha);
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
  uniform float pulseSpeed;
  uniform float intensityMultiplier;
  uniform float softnessMultiplier;
  uniform vec3 heatColor;
  varying vec2 vUv;

  void main() {
    float verticalFade = pow(1.0 - vUv.y, 1.5);
    // softnessMultiplier > 1 widens the visible cross-section (outer sheath).
    float horizontalFade = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0 / softnessMultiplier);
    float energyFlow = sin(vUv.y * 20.0 - time * 3.0) * 0.15 + 0.85;
    float pulse = sin(time * pulseSpeed * 0.55) * 0.2 + 0.8;

    float alpha =
      verticalFade *
      horizontalFade *
      energyFlow *
      pulse *
      intensity *
      intensityMultiplier *
      3.5;

    // HDR output so bloom captures the beam itself, not just the core.
    gl_FragColor = vec4(heatColor * 1.5, alpha);
  }
`;

const FLARE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLARE_FRAG = /* glsl */ `
  uniform float time;
  uniform float intensity;
  uniform vec3 color;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    float core = pow(1.0 - smoothstep(0.0, 0.5, dist), 2.0);

    // Lens-flare style cross: a horizontal and a vertical thin spike.
    float horiz = (1.0 - smoothstep(0.0, 0.02, abs(center.y))) *
                  (1.0 - smoothstep(0.0, 0.4, abs(center.x)));
    float vert  = (1.0 - smoothstep(0.0, 0.02, abs(center.x))) *
                  (1.0 - smoothstep(0.0, 0.4, abs(center.y)));
    float cross = max(horiz, vert) * 0.5;

    float pulse = sin(time * 5.0) * 0.3 + 0.7;
    float a = (core + cross) * pulse * intensity;

    gl_FragColor = vec4(color * 2.0, a);
  }
`;

const CLICK_SPIKE_MS = 500;

function NarrativeMarkerImpl({ group, selected, dimmed, onClick }: Props) {
  const { iso, name, lat, lng, top } = group;
  const [hovered, setHovered] = useState(false);
  const clickSpikeAt = useRef(0);
  const { camera } = useThree();

  const heatLevel = useMemo(() => getHeatLevel(top), [top]);
  const config = HEAT_CONFIG[heatLevel];

  const surfacePos = useMemo(() => latLngToVec3(lat, lng, 1), [lat, lng]);
  const orientation = useMemo(() => surfaceQuaternion(lat, lng), [lat, lng]);
  const surfaceNormal = useMemo(
    () => surfacePos.clone().normalize(),
    [surfacePos]
  );

  // Imperative shader materials so we can mutate uniforms without recompiling.
  const ringMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        intensity: { value: config.intensity },
        pulseSpeed: { value: config.pulseSpeed },
        heatColor: { value: config.color.clone() },
      },
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const innerBeamMat = useMemo(() => makeBeamMaterial(config, 1.0, 1.0), []);
  const outerBeamMat = useMemo(() => makeBeamMaterial(config, 0.3, 2.5), []);

  const flareMat = useMemo(() => {
    if (!config.showFlare) return null;
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        intensity: { value: 1 },
        color: { value: config.color.clone() },
      },
      vertexShader: FLARE_VERT,
      fragmentShader: FLARE_FRAG,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Sync per-config values when the underlying narrative shifts heat level.
  useEffect(() => {
    ringMat.uniforms.heatColor.value.copy(config.color);
    ringMat.uniforms.pulseSpeed.value = config.pulseSpeed;
    innerBeamMat.uniforms.heatColor.value.copy(config.color);
    innerBeamMat.uniforms.pulseSpeed.value = config.pulseSpeed;
    outerBeamMat.uniforms.heatColor.value.copy(config.color);
    outerBeamMat.uniforms.pulseSpeed.value = config.pulseSpeed;
    if (flareMat) flareMat.uniforms.color.value.copy(config.color);
    if (coreMatRef.current) coreMatRef.current.color.copy(config.coreColor);
  }, [config, ringMat, innerBeamMat, outerBeamMat, flareMat]);

  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    camera.getWorldPosition(camDir).normalize();
    const facing = surfaceNormal.dot(camDir);
    const visibility = THREE.MathUtils.smoothstep(facing, -0.05, 0.2);

    let spike = 1;
    const since = performance.now() - clickSpikeAt.current;
    if (since < CLICK_SPIKE_MS) {
      spike = 1 + (1 - since / CLICK_SPIKE_MS);
    }

    const hoverMul = hovered ? 1.5 : 1;
    const dimMul = dimmed && !selected ? 0.4 : 1;

    const i = config.intensity * hoverMul * spike * dimMul * visibility;

    ringMat.uniforms.time.value = t;
    ringMat.uniforms.intensity.value = i;
    innerBeamMat.uniforms.time.value = t;
    innerBeamMat.uniforms.intensity.value = i;
    outerBeamMat.uniforms.time.value = t;
    outerBeamMat.uniforms.intensity.value = i;
    if (flareMat) {
      flareMat.uniforms.time.value = t;
      flareMat.uniforms.intensity.value = i;
    }
    if (coreMatRef.current) {
      coreMatRef.current.opacity = Math.min(
        1,
        0.95 * visibility * dimMul * hoverMul * spike
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

      {/* Inner beam — bright, thin, sharp */}
      <mesh position={[0, config.beamHeight / 2, 0]}>
        <cylinderGeometry
          args={[
            config.beamRadius * 0.25,
            config.beamRadius,
            config.beamHeight,
            12,
            1,
            true,
          ]}
        />
        <primitive object={innerBeamMat} attach="material" />
      </mesh>

      {/* Outer glow sheath — wider, dimmer, soft */}
      <mesh position={[0, config.beamHeight / 2, 0]}>
        <cylinderGeometry
          args={[
            config.beamRadius * 3.5 * 0.25,
            config.beamRadius * 3.5,
            config.beamHeight,
            12,
            1,
            true,
          ]}
        />
        <primitive object={outerBeamMat} attach="material" />
      </mesh>

      {/* Bright core sphere — bloom emitter */}
      <mesh position={[0, 0.002, 0]}>
        <sphereGeometry args={[config.coreSize, 16, 16]} />
        <meshBasicMaterial
          ref={coreMatRef}
          color={config.coreColor}
          transparent
          opacity={0.95}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* HOT-only lens flare burst at the top of the beam */}
      {config.showFlare && flareMat && (
        <Billboard position={[0, config.beamHeight, 0]}>
          <mesh>
            <planeGeometry args={[0.04, 0.04]} />
            <primitive object={flareMat} attach="material" />
          </mesh>
        </Billboard>
      )}

      {showCard && (
        <Html
          position={[0, config.beamHeight + 0.015, 0]}
          zIndexRange={[40, 0]}
          occlude={false}
          center={false}
          style={{ pointerEvents: 'none' }}
        >
          <MarkerCard
            iso={iso}
            name={name}
            narrative={top}
            colorHex={`#${config.color.getHexString()}`}
            totalForCountry={group.total}
          />
        </Html>
      )}
    </group>
  );
}

function makeBeamMaterial(
  config: HeatConfig,
  intensityMultiplier: number,
  softnessMultiplier: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      intensity: { value: config.intensity },
      pulseSpeed: { value: config.pulseSpeed },
      intensityMultiplier: { value: intensityMultiplier },
      softnessMultiplier: { value: softnessMultiplier },
      heatColor: { value: config.color.clone() },
    },
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
  });
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
