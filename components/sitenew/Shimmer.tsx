'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { ease } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

/**
 * Accent-word treatment: a cyan gradient-clipped span that runs ONE shimmer
 * pass (background-position -100% → 200%, 0.9s powerOut) when it scrolls in.
 *
 * REDUCED-MOTION: renders the static cyan gradient, no shimmer sweep.
 */
export default function Shimmer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  const gradient =
    'linear-gradient(100deg, var(--accent-shimmer-1) 0%, var(--accent-shimmer-2) 35%, var(--accent-shimmer-3) 50%, var(--accent-shimmer-2) 65%, var(--accent-shimmer-1) 100%)';

  if (reduced) {
    return (
      <span
        ref={ref}
        className={className}
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--accent-shimmer-2), var(--accent-shimmer-1))',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{
        backgroundImage: gradient,
        backgroundSize: '200% 100%',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }}
      initial={{ backgroundPosition: '-100% 0%' }}
      animate={inView ? { backgroundPosition: '200% 0%' } : { backgroundPosition: '-100% 0%' }}
      transition={{ duration: 0.9, ease: ease.powerOut }}
    >
      {children}
    </motion.span>
  );
}
