import * as THREE from 'three';

/**
 * Camera flight path. One waypoint per section (0→7). The CameraRig damps the
 * camera position + lookAt toward the active section's waypoint (lambda 4),
 * never snapping. Index aligns with the section order in app/siteNEW/page.tsx.
 */
export type Waypoint = {
  pos: [number, number, number];
  look: [number, number, number];
  intent: string;
};

export const WAYPOINTS: Waypoint[] = [
  { pos: [2.25, 0.7, 3.23], look: [0, 0, 0], intent: 'Hero — full sphere centred in canvas (camera back enough to never crop, ~97% vh); travel offsets it per slot' },
  { pos: [2.4, 0.3, 1.6], look: [0.2, 0, 0], intent: 'Problem — pull back, globe small/left' },
  { pos: [0.6, -0.2, 1.1], look: [0.0, 0, 0], intent: 'Insight — descend to surface (ignition)' },
  { pos: [0.9, 0.1, 1.4], look: [0.3, 0, 0], intent: 'Product — tilt, globe right, mock left' },
  { pos: [2.0, 0.6, 1.9], look: [0.0, 0, 0], intent: 'HowItWorks — high orbit, pipeline reads' },
  { pos: [2.6, 0.0, 2.2], look: [0.0, 0, 0], intent: 'Vision — far orbit, three cards breathe' },
  { pos: [0.0, 0.0, 3.0], look: [0.0, 0, 0], intent: 'CTA — dead-center, planet behind copy' },
  { pos: [0.0, 0.4, 3.4], look: [0.0, 0, 0], intent: 'Footer — drift up, fade to black' },
];

export const INSIGHT_SECTION = 2;

/** Vector3 forms, built once (camera rig reads these every frame). */
export const WAYPOINT_POS: THREE.Vector3[] = WAYPOINTS.map(
  (w) => new THREE.Vector3(...w.pos)
);
export const WAYPOINT_LOOK: THREE.Vector3[] = WAYPOINTS.map(
  (w) => new THREE.Vector3(...w.look)
);
