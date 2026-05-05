'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface Props {
  /** World-space direction of the key directional light. Anchor sits at
   *  1.04× the normalized direction so it floats just past the moon's
   *  silhouette where the sun would visually meet the rim. */
  sunDirection?: [number, number, number];
}

/**
 * Tiny HDR sphere placed just past the moon's silhouette in the sun
 * direction. Components > 1 with toneMapped=false survive the
 * tone-mapping stage and feed the bloom pass directly, blooming into a
 * soft cinematic flare that visually anchors the directional key light.
 *
 * Lives at a fixed world position (not parented to the rotating moon
 * group) so it doesn't sweep around with the moon's spin.
 */
export default function SunAnchorFlare({
  sunDirection = [5, 2, 3],
}: Props) {
  const position = useMemo(() => {
    const v = new THREE.Vector3(...sunDirection)
      .normalize()
      .multiplyScalar(1.04);
    return [v.x, v.y, v.z] as [number, number, number];
  }, [sunDirection]);

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 24, 24]} />
      <meshBasicMaterial color={[2.5, 2.5, 2.2]} toneMapped={false} />
    </mesh>
  );
}
