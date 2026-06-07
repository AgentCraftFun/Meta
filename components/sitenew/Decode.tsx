'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { color, ease } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

type Props = {
  children: ReactNode;
  /** Start the reveal when true. */
  play: boolean;
  delay?: number;
  className?: string;
};

/**
 * Headline mask-reveal. A clip-path sweeps inset(0 100% 0 0) → inset(0) over
 * 0.7s quartIO while a 2px cyan edge-line rides the reveal front, then fades.
 *
 * REDUCED-MOTION: opacity-only 0.3s, NO clip / NO edge-line.
 */
export default function Decode({ children, play, delay = 0, className }: Props) {
  const reduced = useSceneStore((s) => s.reducedMotion);

  if (reduced) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, delay, ease: ease.expoOut }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={play ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 100% 0 0)' }}
        transition={{ duration: 0.7, delay, ease: ease.quartIO }}
      >
        {children}
      </motion.div>
      {/* cyan edge-line riding the reveal front */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-[2px]"
        style={{ background: color.cyan, boxShadow: `0 0 12px ${color.cyan}` }}
        initial={{ left: '0%', opacity: 0 }}
        animate={
          play
            ? { left: ['0%', '100%'], opacity: [0, 1, 1, 0] }
            : { left: '0%', opacity: 0 }
        }
        transition={{ duration: 0.7, delay, ease: ease.quartIO }}
      />
    </div>
  );
}
