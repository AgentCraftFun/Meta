'use client';

import { useEffect, useRef, useState } from 'react';
import { RETICLE_LAMBDA, color, z } from './motion';
import { useSceneStore } from './useSceneStore';

/**
 * Targeting-reticle cursor for the hero. A cyan ring lerps to the pointer
 * (lambda 6) and expands 1 → 1.4 over interactive elements. Replaces the native
 * cursor while active (restored on leave / scroll-away).
 *
 * Hero-only: shown while scrollProgress < 0.1. Hidden on touch + reduced-motion.
 */
export default function Reticle() {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const scale = useRef(1);
  const targetScale = useRef(1);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (reduced || !fine) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const el = e.target as HTMLElement | null;
      targetScale.current = el && el.closest('a,button') ? 1.4 : 1;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const a = 1 - Math.exp(-RETICLE_LAMBDA * dt);
      pos.current.x += (target.current.x - pos.current.x) * a;
      pos.current.y += (target.current.y - pos.current.y) * a;
      scale.current += (targetScale.current - scale.current) * a;

      // Visible only in the hero band (scrollProgress < 0.1).
      const inHero = useSceneStore.getState().scrollProgress < 0.1;
      const ring = ringRef.current;
      if (ring) {
        ring.style.opacity = inHero ? '1' : '0';
        ring.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%) scale(${scale.current})`;
      }
      document.documentElement.style.cursor = inHero ? 'none' : '';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      document.documentElement.style.cursor = '';
    };
  }, [reduced]);

  if (!enabled) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 hidden md:block"
      style={{ zIndex: z.reticle, opacity: 0, transition: 'opacity 200ms ease-out' }}
    >
      <div
        className="rounded-full"
        style={{ width: 26, height: 26, border: `1.5px solid ${color.cyan}`, boxShadow: `0 0 12px ${color.cyan}66` }}
      />
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{ width: 3, height: 3, transform: 'translate(-50%,-50%)', background: color.cyan }}
      />
    </div>
  );
}
