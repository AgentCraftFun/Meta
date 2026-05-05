'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Tiny HDR sphere placed just past the moon's silhouette in the sun
 * direction. The HDR colour (components > 1) trips the bloom pass and
 * blooms into a soft cinematic anchor where the directional key light
 * meets the rim — visually grounding the sun even though there's no
 * actual sun mesh in the scene.
 *
 * The anchor tracks the moon group's WORLD POSITION each frame (so it
 * follows the panel-open X-lerp) but ignores the moon's Y-axis spin,
 * which is why it lives outside ClaimedSurface and looks the moon up
 * by name through the scene graph.
 */
export default function SunAnchorFlare() {
  const ref = useRef<THREE.Mesh>(null);
  const { scene } = useThree();

  const sunOffset = useMemo(
    () => new THREE.Vector3(5, 2, 3).normalize().multiplyScalar(1.04),
    []
  );

  // HDR white-warm — components > 1 with toneMapped=false survive the
  // tone-mapping stage and feed the bloom pass directly.
  const color = useMemo(() => new THREE.Color(2.5, 2.5, 2.2), []);

  useFrame(() => {
    if (!ref.current) return;
    const surface = scene.getObjectByName('claimed-surface');
    if (!surface) return;
    surface.updateMatrixWorld(true);
    const center = new THREE.Vector3();
    surface.getWorldPosition(center);
    ref.current.position.set(
      center.x + sunOffset.x,
      center.y + sunOffset.y,
      center.z + sunOffset.z
    );
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 16, 16]} />
      <meshBasicMaterial
        color={color}
        toneMapped={false}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}
