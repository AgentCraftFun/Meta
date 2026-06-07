'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { color, ease } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

type Props = {
  children: ReactNode;
  /**
   * Controlled trigger. When omitted, Decode self-triggers once on scroll-in
   * (used for section headlines); Hero passes `play={booted}` explicitly.
   */
  play?: boolean;
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
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const active = play ?? inView;

  if (reduced) {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3, delay, ease: ease.expoOut }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={active ? { clipPath: 'inset(0 0% 0 0)' } : { clipPath: 'inset(0 100% 0 0)' }}
        transition={{ duration: 0.7, delay, ease: ease.quartIO }}
      >
        {children}
      </motion.div>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-[2px]"
        style={{ background: color.cyan, boxShadow: `0 0 12px ${color.cyan}` }}
        initial={{ left: '0%', opacity: 0 }}
        animate={
          active ? { left: ['0%', '100%'], opacity: [0, 1, 1, 0] } : { left: '0%', opacity: 0 }
        }
        transition={{ duration: 0.7, delay, ease: ease.quartIO }}
      />
    </div>
  );
}
