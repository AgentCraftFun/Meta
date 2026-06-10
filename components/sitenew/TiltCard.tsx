'use client';

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { spring } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

/**
 * Card micro-interaction wrapper:
 *   - cursor tilt up to 5° (magnetic spring) toward the pointer
 *   - moving spec-highlight (radial cyan 8% tracking the cursor)
 *   - hover lift: scale 1.02 / y -2 / shadow grow (0.2s snappy)
 *   - a single scan-line sweep on first hover
 *
 * REDUCED-MOTION / touch: no tilt, no highlight, no reticle — hover is a plain
 * border/opacity change (no transform).
 */
export default function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const [swept, setSwept] = useState(false);

  const rx = useSpring(0, spring.magnetic);
  const ry = useSpring(0, spring.magnetic);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const highlight = useMotionTemplate`radial-gradient(220px circle at ${mx}% ${my}%, rgba(34,211,238,0.08), transparent 60%)`;

  const isCoarse =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const off = reduced || isCoarse;

  if (off) {
    return (
      <div className={`group/tilt transition-colors duration-200 ${className ?? ''}`}>
        {children}
      </div>
    );
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width; // 0..1
    const ny = (e.clientY - r.top) / r.height;
    ry.set((nx - 0.5) * 10); // ±5°
    rx.set(-(ny - 0.5) * 10);
    mx.set(nx * 100);
    my.set(ny * 100);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <div style={{ perspective: 900 }} className={className}>
      <motion.div
        className="group/tilt relative h-full rounded-[inherit] will-change-transform"
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.02, y: -2, boxShadow: '0 18px 50px -22px rgba(34,211,238,0.45)' }}
        transition={spring.snappy}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onHoverStart={() => setSwept(true)}
      >
        {children}

        {/* moving spec-highlight (clips to the host card's radius) */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover/tilt:opacity-100"
          style={{ background: highlight }}
        />

        {/* single scan-line sweep on first hover */}
        {swept && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(34,211,238,0.7) 50%, transparent)',
            }}
            initial={{ top: '0%', opacity: 0 }}
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </motion.div>
    </div>
  );
}
