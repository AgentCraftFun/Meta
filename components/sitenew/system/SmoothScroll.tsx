'use client';

import Lenis from 'lenis';
import { useEffect, type ReactNode } from 'react';
import { useSceneStore } from './useSceneStore';

/**
 * Root wrapper for /siteNEW. Owns:
 *   1. prefers-reduced-motion detection → store.reducedMotion (set once).
 *   2. Lenis smooth scroll (lerp 0.1, duration 1.2). Disabled under RM —
 *      native scroll takes over, no Lenis instance is created.
 *   3. Normalized document scroll progress 0→1 → store.scrollProgress, on
 *      every scroll frame (Lenis when active, a passive listener under RM).
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = mq.matches;
    setReducedMotion(reduced);

    // Helper: doc progress 0→1 from raw scrollY.
    const docProgress = (scrollY: number) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    };

    // Reduced-motion path: native scroll, passive listener, no Lenis.
    if (reduced) {
      const onScroll = () => setScrollProgress(docProgress(window.scrollY));
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    // Smooth path: Lenis drives scroll + emits normalized progress.
    const lenis = new Lenis({ lerp: 0.1, duration: 1.2 });

    lenis.on('scroll', ({ scroll, limit }: { scroll: number; limit: number }) => {
      setScrollProgress(limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0);
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [setReducedMotion, setScrollProgress]);

  return <>{children}</>;
}
