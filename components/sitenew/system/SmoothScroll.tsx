'use client';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, type ReactNode } from 'react';
import { useSceneStore } from './useSceneStore';

/**
 * Root wrapper for /siteNEW. Owns:
 *   1. prefers-reduced-motion detection → store.reducedMotion (set once).
 *   2. Lenis smooth scroll (lerp 0.1, duration 1.2) for free-scroll contexts
 *      (mobile / coarse pointer, or the ?place tuning tool). Disabled under RM
 *      AND under desktop snap mode — both use native scroll (SnapScroll then
 *      drives a quint-eased programmatic scroll between section centres).
 *   3. Normalized document scroll progress + velocity → store, every frame.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);
  const setScrollVelocity = useSceneStore((s) => s.setScrollVelocity);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = mq.matches;
    setReducedMotion(reduced);

    // Desktop snap mode owns scrolling (native + programmatic tween); skip Lenis
    // so the two don't both intercept the wheel. ?place keeps Lenis for tuning.
    const hasPlace = new URLSearchParams(window.location.search).has('place');
    const snap =
      !reduced &&
      !hasPlace &&
      window.matchMedia('(pointer: fine)').matches &&
      window.matchMedia('(min-width: 768px)').matches;

    // Helper: doc progress 0→1 from raw scrollY.
    const docProgress = (scrollY: number) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    };

    // Native-scroll path (reduced-motion OR desktop snap): passive listener
    // publishes progress + an approximate per-frame velocity. No Lenis.
    if (reduced || snap) {
      let lastY = window.scrollY;
      let lastT = performance.now();
      const onScroll = () => {
        setScrollProgress(docProgress(window.scrollY));
        const now = performance.now();
        const dt = now - lastT;
        if (dt > 0) setScrollVelocity(((window.scrollY - lastY) / dt) * 16);
        lastY = window.scrollY;
        lastT = now;
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    // Smooth free-scroll path: Lenis (mobile / coarse pointer / ?place).
    const lenis = new Lenis({ lerp: 0.1, duration: 1.2 });
    // Expose the instance so the globe controller can read ONE smoothed scroll
    // source (lenis.scroll) instead of mixing it with window.scrollY.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    lenis.on(
      'scroll',
      ({ scroll, limit, velocity }: { scroll: number; limit: number; velocity: number }) => {
        setScrollProgress(limit > 0 ? Math.min(1, Math.max(0, scroll / limit)) : 0);
        setScrollVelocity(velocity);
        ScrollTrigger.update();
      }
    );

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, [setReducedMotion, setScrollProgress, setScrollVelocity]);

  return <>{children}</>;
}
