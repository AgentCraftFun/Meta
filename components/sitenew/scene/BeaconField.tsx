'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { latLngToVec3, surfaceQuaternion } from '@/lib/geo';
import { spawnOrder } from '../system/seededFeed';
import { useSceneStore } from '../system/useSceneStore';
import { INSIGHT_SECTION } from './waypoints';

/**
 * The beacon field. ~24 light pillars at real lat/long, rendered as a single
 * InstancedMesh (pillars) + a second instanced point set, both inside the
 * rotating earth group. Per-instance intensity is carried in instanceColor
 * (additive blending → brightness == intensity) and pillar height via a
 * per-frame instanceMatrix scale.
 *
 * Behaviour:
 *   - DIM (0.12) until activeSection ≥ Insight (2)
 *   - then a staggered cascade ignites them (0.08s apart), each 0.6s expoOut
 *   - 3–4 cyan→amber arcs draw between the hottest beacons, revealed across the
 *     Insight scroll range [0.1, 0.7] (BufferGeometry drawRange)
 *
 * `simplified` (mobile-light): ignite together (no stagger), no arcs.
 * `frozen` (reduced — canvas not normally mounted): steady-lit, no cascade/arcs.
 */

type Seed = { lat: number; lng: number; heat: number };

// Real attention hotspots; heat 0 = cyan (system) → 1 = red (narrative intensity).
const SEEDS: Seed[] = [
  { lat: 38, lng: -97, heat: 0.9 }, // US
  { lat: 35, lng: 104, heat: 1.0 }, // CN
  { lat: 39, lng: 35, heat: 0.85 }, // TR
  { lat: 51, lng: 9, heat: 0.3 }, // DE
  { lat: 48, lng: 2, heat: 0.35 }, // FR
  { lat: 54, lng: -2, heat: 0.4 }, // GB
  { lat: 36, lng: 138, heat: 0.5 }, // JP
  { lat: 37, lng: 127, heat: 0.55 }, // KR
  { lat: 20, lng: 78, heat: 0.7 }, // IN
  { lat: -14, lng: -51, heat: 0.6 }, // BR
  { lat: -25, lng: 133, heat: 0.2 }, // AU
  { lat: 61, lng: 105, heat: 0.45 }, // RU
  { lat: 23, lng: 45, heat: 0.5 }, // SA
  { lat: 26, lng: 30, heat: 0.4 }, // EG
  { lat: -30, lng: 24, heat: 0.25 }, // ZA
  { lat: 4, lng: 102, heat: 0.3 }, // MY
  { lat: 1, lng: 114, heat: 0.35 }, // ID
  { lat: 23, lng: 121, heat: 0.6 }, // TW
  { lat: 32, lng: 53, heat: 0.65 }, // IR
  { lat: 19, lng: -99, heat: 0.45 }, // MX
  { lat: 45, lng: -63, heat: 0.2 }, // CA-E
  { lat: 41, lng: 12, heat: 0.3 }, // IT
  { lat: 40, lng: -3, heat: 0.3 }, // ES
  { lat: 13, lng: 100, heat: 0.4 }, // TH
];

const PILLAR_H = 0.22;
const DIM = 0.12;
const CYAN = new THREE.Color('#22D3EE');
const AMBER = new THREE.Color('#FBBF24');
const RED = new THREE.Color('#EF4444');

function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}

function heatColor(heat: number, out: THREE.Color): THREE.Color {
  if (heat < 0.5) return out.copy(CYAN).lerp(AMBER, heat / 0.5);
  return out.copy(AMBER).lerp(RED, (heat - 0.5) / 0.5);
}

const ARC_SEGMENTS = 48;

export default function BeaconField({
  simplified = false,
  frozen = false,
}: {
  simplified?: boolean;
  frozen?: boolean;
}) {
  const pillarsRef = useRef<THREE.InstancedMesh>(null);
  const pointsRef = useRef<THREE.InstancedMesh>(null);
  const activatedAt = useRef<number | null>(null);

  const count = SEEDS.length;

  // Precompute base (position + orientation, no scale) matrices and base colors.
  const { baseMatrices, baseColors, positions } = useMemo(() => {
    const tmp = new THREE.Matrix4();
    const posM = new THREE.Matrix4();
    const c = new THREE.Color();
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const pos: THREE.Vector3[] = [];
    for (const s of SEEDS) {
      const p = latLngToVec3(s.lat, s.lng, 1);
      const q = surfaceQuaternion(s.lat, s.lng);
      posM.makeRotationFromQuaternion(q);
      posM.setPosition(p);
      mats.push(posM.clone());
      cols.push(heatColor(s.heat, c).clone().multiplyScalar(1.4));
      pos.push(p.clone());
    }
    void tmp;
    return { baseMatrices: mats, baseColors: cols, positions: pos };
  }, []);

  // Geometry: pillar base at y=0, grows along +Y (the surface normal).
  const pillarGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.004, 0.012, PILLAR_H, 6, 1, true);
    g.translate(0, PILLAR_H / 2, 0);
    return g;
  }, []);
  const pointGeo = useMemo(() => new THREE.SphereGeometry(0.012, 10, 10), []);

  const pillarMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  );
  const pointMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Arcs between the hottest beacons (top-heat pairs). Built as THREE.Line
  // objects (R3F's <line> intrinsic collides with SVG types, so we render via
  // <primitive>). drawRange on each geometry is animated for the draw-on effect.
  const arcs = useMemo(() => {
    const ranked = SEEDS.map((s, i) => ({ i, heat: s.heat }))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 6)
      .map((r) => r.i);
    const pairs: [number, number][] = [
      [ranked[0], ranked[1]],
      [ranked[0], ranked[2]],
      [ranked[1], ranked[3]],
      [ranked[2], ranked[4]],
    ];
    return pairs.map(([a, b]) => {
      const pa = positions[a];
      const pb = positions[b];
      const mid = pa.clone().add(pb).multiplyScalar(0.5).normalize();
      const dist = pa.distanceTo(pb);
      const control = mid.multiplyScalar(1 + Math.min(0.45, dist * 0.35));
      const curve = new THREE.QuadraticBezierCurve3(pa.clone(), control, pb.clone());
      const pts = curve.getPoints(ARC_SEGMENTS);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const colors = new Float32Array((ARC_SEGMENTS + 1) * 3);
      const c = new THREE.Color();
      for (let k = 0; k <= ARC_SEGMENTS; k++) {
        c.copy(CYAN).lerp(AMBER, k / ARC_SEGMENTS);
        colors[k * 3] = c.r;
        colors[k * 3 + 1] = c.g;
        colors[k * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      return new THREE.Line(geo, mat);
    });
  }, [positions]);

  const scaleM = useMemo(() => new THREE.Matrix4(), []);
  const outM = useMemo(() => new THREE.Matrix4(), []);
  const colScratch = useMemo(() => new THREE.Color(), []);
  const spawnList = useMemo(() => spawnOrder(count), [count]);
  const spawnPtr = useRef(0);
  const spawnAt = useRef(0);

  useFrame((state) => {
    const { activeSection, sectionProgress } = useSceneStore.getState();
    const active = activeSection >= INSIGHT_SECTION;
    const time = state.clock.elapsedTime;
    const paused = typeof document !== 'undefined' && document.hidden;

    if (active && activatedAt.current === null) activatedAt.current = performance.now();
    if (!active) activatedAt.current = null;

    const elapsed =
      activatedAt.current !== null
        ? (performance.now() - activatedAt.current) / 1000
        : 0;

    const pillars = pillarsRef.current;
    const points = pointsRef.current;
    if (!pillars || !points) return;
    if (paused) return; // pause-on-hidden: stop touching buffers

    // Spawn/decay: every ~12s a new beacon pops somewhere new (seeded order).
    if (!frozen && !simplified) {
      if (time - spawnAt.current > 12) {
        spawnAt.current = time;
        spawnPtr.current = (spawnPtr.current + 1) % count;
      }
    }
    const spawnIndex = spawnList[spawnPtr.current];
    const spawnElapsed = time - spawnAt.current;
    const spawnBump =
      !frozen && !simplified && spawnElapsed < 3
        ? Math.sin((Math.PI * spawnElapsed) / 3) * 0.6
        : 0;

    for (let i = 0; i < count; i++) {
      let intensity: number;
      if (frozen) {
        intensity = active ? 1 : DIM;
      } else if (active) {
        const delay = simplified ? 0 : i * 0.08;
        const t = easeOutExpo((elapsed - delay) / 0.6);
        intensity = DIM + (1 - DIM) * t;
      } else {
        intensity = DIM;
      }

      // idle micro-pulse (±0.15, seeded per-instance phase) + spawn transient
      if (!frozen) {
        intensity += Math.sin(time * 1.5 + i * 1.7) * 0.15;
        if (i === spawnIndex) intensity += spawnBump;
        intensity = Math.max(0, intensity);
      }

      // pillar: scale height by intensity
      scaleM.makeScale(1, Math.max(0.001, intensity), 1);
      outM.multiplyMatrices(baseMatrices[i], scaleM);
      pillars.setMatrixAt(i, outM);
      points.setMatrixAt(i, baseMatrices[i]);

      colScratch.copy(baseColors[i]).multiplyScalar(intensity);
      pillars.setColorAt(i, colScratch);
      points.setColorAt(i, colScratch);
    }
    pillars.instanceMatrix.needsUpdate = true;
    points.instanceMatrix.needsUpdate = true;
    if (pillars.instanceColor) pillars.instanceColor.needsUpdate = true;
    if (points.instanceColor) points.instanceColor.needsUpdate = true;

    // Arcs: reveal across Insight scroll range [0.1, 0.7].
    if (!simplified && !frozen) {
      const insightProg =
        activeSection === INSIGHT_SECTION
          ? sectionProgress
          : activeSection > INSIGHT_SECTION
          ? 1
          : 0;
      const reveal = THREE.MathUtils.clamp((insightProg - 0.1) / 0.6, 0, 1);
      const drawn = Math.floor(reveal * (ARC_SEGMENTS + 1));
      for (const line of arcs) line.geometry.setDrawRange(0, drawn);
    }
  });

  return (
    <group>
      <instancedMesh
        ref={pillarsRef}
        args={[pillarGeo, pillarMat, count]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pointsRef}
        args={[pointGeo, pointMat, count]}
        frustumCulled={false}
      />
      {!simplified &&
        !frozen &&
        arcs.map((line, k) => <primitive key={k} object={line} />)}
    </group>
  );
}
