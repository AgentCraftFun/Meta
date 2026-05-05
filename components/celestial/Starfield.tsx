'use client';

import { Stars } from '@react-three/drei';

type Props = {
  radius?: number;
  depth?: number;
  count?: number;
  factor?: number;
  saturation?: number;
  speed?: number;
  fade?: boolean;
};

/**
 * Thin wrapper around drei's <Stars /> that locks in the project's "sparse,
 * lonely" defaults. Override any prop per-scene as needed.
 */
export default function Starfield({
  radius = 300,
  depth = 60,
  count = 4000,
  factor = 2,
  saturation = 0.3,
  speed = 0.3,
  fade = true,
}: Props) {
  return (
    <Stars
      radius={radius}
      depth={depth}
      count={count}
      factor={factor}
      saturation={saturation}
      speed={speed}
      fade={fade}
    />
  );
}
