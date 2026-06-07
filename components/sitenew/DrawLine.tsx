'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { color, dur, ease } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

type Props = {
  /** 'h' = horizontal connector, 'v' = vertical. */
  orientation?: 'h' | 'v';
  className?: string;
  /** Stroke color (defaults to cyan). */
  stroke?: string;
  delay?: number;
  /** px length of the long axis; the short axis is 2. */
  length?: number;
};

/**
 * SVG connector that draws itself via strokeDashoffset 1→0 when it scrolls into
 * view (0.6s expoOut). Used for the Insight flow + HowItWorks pipeline links so
 * they "build as you arrive".
 *
 * REDUCED-MOTION: renders complete (no draw).
 */
export default function DrawLine({
  orientation = 'h',
  className,
  stroke = color.cyan,
  delay = 0,
  length = 100,
}: Props) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  const horizontal = orientation === 'h';
  const w = horizontal ? length : 2;
  const h = horizontal ? 2 : length;
  const d = horizontal ? `M0 1 H${length}` : `M1 0 V${length}`;

  return (
    <svg
      ref={ref}
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      fill="none"
    >
      <motion.path
        d={d}
        stroke={stroke}
        strokeWidth={2}
        pathLength={1}
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={reduced ? { pathLength: 1 } : inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: dur.reveal, ease: ease.expoOut, delay }}
        style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
      />
    </svg>
  );
}
