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
 * Thin wrapper around drei's <Stars />. Defaults render visible-but-subtle
 * pinpoints across the whole hemisphere — bigger and slightly more
 * numerous than the original "sparse, lonely" tuning, which were dim
 * enough that the dithered space gradient swallowed them.
 */
export default function Starfield({
  radius = 220,
  depth = 60,
  count = 6000,
  factor = 4,
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
