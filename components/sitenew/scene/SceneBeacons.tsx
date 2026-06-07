'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { latLngToVec3, surfaceQuaternion } from '@/lib/geo';
import { useSceneStore } from '../system/useSceneStore';

/**
 * §3 PRODUCT — SURFACE BEACONS.
 *
 * Four heat-coded light pillars (the "Beacons By Country" feature, BCN-02) that
 * rise out of the globe ONLY while it is settled in the §3 live panel — one per
 * narrative in the side list (2 red, 2 amber). They are children of the rotating
 * earth group, so they spin with the planet and the CSS transform that parks the
 * globe in the panel carries them along too.
 *
 * DRIVEN ENTIRELY BY `globeTravel` + `arrivalNonce` (one source each):
 *   • presence  = centredness on §3 = max(0, 1 − |globeTravel − 3|). Beacons grow
 *     out of the surface as the globe flies in and retract as it leaves — fully
 *     seamless, symmetric, no pop on exit.
 *   • lock pop  = a one-shot, per-beacon-staggered scale kick fired the frame the
 *     globe SETTLES (SnapStage's arrivalNonce, §3 only) — pops in lockstep with
 *     the panel LOCK-IN beat.
 *   • facing    = beacons on the far side fade out by surface-normal·camera, so
 *     they never punch through the globe.
 *
 * Reduced-motion / mobile never mount the live globe (static fallback instead),
 * so this component simply isn't rendered there. transform/opacity only; cheap
 * additive MeshBasicMaterials, early-out when nowhere near §3.
 */

const PRODUCT_INDEX = 3;

// One beacon per narrative — colour matches the panel heat dots (2 red, 2 amber)
// at spread lat/lng so the globe reads as a live, multi-region board.
const BEACONS = [
  { lat: 40, lng: -100, color: '#ef4444' }, // United States — red
  { lat: -12, lng: -55, color: '#fbbf24' }, // Brazil — amber
  { lat: 41, lng: 32, color: '#ef4444' }, // Türkiye — red
  { lat: 34, lng: 108, color: '#fbbf24' }, // China — amber
];

const REVEAL_STAGGER = 0.06; // per-beacon offset in centredness space
const REVEAL_WIDTH = 0.7; // centredness span over which a beacon fully reveals
const POP_MS = 420; // lock-pop duration
const POP_STAGGER_MS = 55; // per-beacon pop offset
const WHITE = new THREE.Color('#ffffff');

export default function SceneBeacons() {
  const { camera } = useThree();

  const beacons = useMemo(
    () =>
      BEACONS.map((b) => {
        const pos = latLngToVec3(b.lat, b.lng, 1);
        return { pos, quat: surfaceQuaternion(b.lat, b.lng), color: new THREE.Color(b.color) };
      }),
    []
  );

  // Imperative additive materials so opacity can be mutated per-frame.
  const mats = useMemo(
    () =>
      beacons.map((b) => {
        const make = (color: THREE.Color, opacity = 0) =>
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          });
        return {
          beam: Object.assign(make(b.color.clone()), { side: THREE.DoubleSide }),
          halo: make(b.color.clone()),
          core: make(b.color.clone().lerp(WHITE, 0.65)),
        };
      }),
    [beacons]
  );

  useEffect(
    () => () => {
      mats.forEach((m) => {
        m.beam.dispose();
        m.halo.dispose();
        m.core.dispose();
      });
    },
    [mats]
  );

  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const beamRefs = useRef<(THREE.Group | null)[]>([]);
  const coreRefs = useRef<(THREE.Mesh | null)[]>([]);
  const haloRefs = useRef<(THREE.Mesh | null)[]>([]);

  const lastNonce = useRef(0);
  const popStart = useRef(-1);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const worldNormal = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const st = useSceneStore.getState();
    const centred = Math.max(0, 1 - Math.abs(st.globeTravel - PRODUCT_INDEX));

    // Fire the lock-pop the frame §3 is reached (re-arms each arrival).
    if (st.arrivalNonce !== lastNonce.current) {
      lastNonce.current = st.arrivalNonce;
      if (st.arrivedSection === PRODUCT_INDEX && !st.reducedMotion) {
        popStart.current = performance.now();
      }
    }

    // Nowhere near §3 and no pop in flight → park everything hidden, cheap exit.
    const popElapsed = popStart.current >= 0 ? performance.now() - popStart.current : Infinity;
    if (centred <= 0.001 && popElapsed > POP_MS + BEACONS.length * POP_STAGGER_MS) {
      for (const g of groupRefs.current) if (g) g.visible = false;
      return;
    }

    camera.getWorldPosition(camDir).normalize(); // globe sits at origin

    for (let i = 0; i < beacons.length; i++) {
      const g = groupRefs.current[i];
      const beam = beamRefs.current[i];
      const core = coreRefs.current[i];
      const halo = haloRefs.current[i];
      if (!g || !beam || !core || !halo) continue;

      // Eased, staggered reveal straight from centredness (already smooth).
      const reveal = THREE.MathUtils.smoothstep(
        centred - i * REVEAL_STAGGER,
        0,
        REVEAL_WIDTH
      );

      // One-shot lock pop (0→1→0), staggered per beacon.
      let pop = 0;
      const pe = popElapsed - i * POP_STAGGER_MS;
      if (pe >= 0 && pe < POP_MS) pop = Math.sin((pe / POP_MS) * Math.PI);

      // Far-side fade: world surface normal vs camera direction.
      g.getWorldPosition(worldNormal).normalize();
      const facing = THREE.MathUtils.smoothstep(worldNormal.dot(camDir), -0.05, 0.25);

      const a = reveal * facing;
      g.visible = a > 0.002 || pop > 0.01;

      // Beam grows out of the surface (scale-Y from the base) + a touch on pop.
      beam.scale.y = Math.max(0.0001, reveal * (1 + 0.22 * pop));
      mats[i].beam.opacity = a * 0.8;

      const coreS = reveal * (1 + 0.75 * pop);
      core.scale.setScalar(Math.max(0.0001, coreS));
      mats[i].core.opacity = a;

      const haloS = reveal * (1 + 0.45 * pop);
      halo.scale.setScalar(Math.max(0.0001, haloS));
      mats[i].halo.opacity = a * 0.45;
    }
  });

  return (
    <group>
      {beacons.map((b, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={b.pos}
          quaternion={b.quat}
          visible={false}
        >
          {/* Light pillar — a hollow cone rising radially from the surface.
              Wrapped so scale-Y grows it from the base, not the centre. */}
          <group
            ref={(el) => {
              beamRefs.current[i] = el;
            }}
            scale-y={0.0001}
          >
            <mesh position={[0, 0.14, 0]} material={mats[i].beam}>
              <coneGeometry args={[0.014, 0.28, 18, 1, true]} />
            </mesh>
          </group>
          {/* Soft glow halo */}
          <mesh
            ref={(el) => {
              haloRefs.current[i] = el;
            }}
            material={mats[i].halo}
            scale={0.0001}
          >
            <sphereGeometry args={[0.05, 16, 16]} />
          </mesh>
          {/* Hot core dot on the surface */}
          <mesh
            ref={(el) => {
              coreRefs.current[i] = el;
            }}
            material={mats[i].core}
            scale={0.0001}
          >
            <sphereGeometry args={[0.02, 16, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
