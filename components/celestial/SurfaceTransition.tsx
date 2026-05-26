'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSurfaceTransition } from '@/lib/useSurfaceTransition';

const SURFACE_HREF = {
  earth: '/map',
  moon: '/moon',
} as const;

const HOLD_MS = 220;

/**
 * Full-viewport black overlay that bridges the EARTH ↔ MOON route swap.
 * Mounted in app/layout.tsx so it persists across pages. Driven by the
 * useSurfaceTransition store: SurfaceToggle calls start(from, to), this
 * component runs the timed phases and dispatches router.push at peak black.
 */
export default function SurfaceTransition() {
  const phase = useSurfaceTransition((s) => s.phase);
  const fromSurface = useSurfaceTransition((s) => s.fromSurface);
  const toSurface = useSurfaceTransition((s) => s.toSurface);
  const setPhase = useSurfaceTransition((s) => s.setPhase);
  const router = useRouter();

  useEffect(() => {
    if (phase === 'fadeIn') {
      // After the 400ms fade-in completes, swap routes at peak black and
      // hold the cyan readout for a beat before letting the overlay exit.
      const id = window.setTimeout(() => {
        if (toSurface) router.push(SURFACE_HREF[toSurface]);
        setPhase('hold');
      }, 400);
      return () => window.clearTimeout(id);
    }
    if (phase === 'hold') {
      const id = window.setTimeout(() => setPhase('fadeOut'), HOLD_MS);
      return () => window.clearTimeout(id);
    }
    // 'fadeOut' termination is handled by AnimatePresence onExitComplete.
  }, [phase, toSurface, router, setPhase]);

  // Overlay is mounted while we want it visible (fadeIn or hold). On fadeOut
  // we remove the element from the tree so AnimatePresence can run its
  // exit animation and reset the phase to idle on completion.
  const visible = phase === 'fadeIn' || phase === 'hold';

  const readout =
    fromSurface && toSurface
      ? `Transitioning / ${fromSurface.toUpperCase()} → ${toSurface.toUpperCase()}`
      : '';

  return (
    <AnimatePresence onExitComplete={() => setPhase('idle')}>
      {visible && (
        <motion.div
          key="surface-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
          className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'hold' ? 1 : 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center gap-2 font-mono"
          >
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.45em] text-cyan-300/85">
              <span className="h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
              {readout}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
