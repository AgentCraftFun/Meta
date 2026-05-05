'use client';

import ShootingStar from '@/components/celestial/ShootingStar';
import SpaceGradient from '@/components/celestial/SpaceGradient';
import Stage from '@/components/celestial/Stage';
import Starfield from '@/components/celestial/Starfield';

/**
 * Phase A scaffold for the Moon scene. Just confirms the route + the generic
 * celestial primitives work in isolation: dark space, sparse stars, the
 * occasional shooting star. The moon mesh and orbiting token satellites
 * arrive in Phase B.
 */
export default function MoonScene() {
  return (
    <Stage
      camera={{ position: [0, 0, 4], fov: 38, near: 0.1, far: 600 }}
      showLoadingScreen={false}
    >
      <SpaceGradient />
      <Starfield />
      <ShootingStar />
      <ambientLight intensity={0.05} color="#1a2540" />
    </Stage>
  );
}
