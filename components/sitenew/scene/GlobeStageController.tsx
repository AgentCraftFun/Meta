'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { GLOBE_ORIGIN, SLOTS, lerpSlot } from './globeSlots';

/**
 * The travelling globe. ONE rAF loop reads smoothed scroll (activeSection +
 * sectionProgress from the store) and damps the #globe-transform wrapper toward
 * the current slot using GLOBE_DAMP_LAMBDA — buttery, never snaps.
 *
 * Applies ONLY transform (translate3d + scale), filter (brightness/blur) and
 * opacity. transform-origin is centered; the slot's target center is reached by
 * compensating for the globe's natural hero offset (GLOBE_ORIGIN).
 *
 * PHASE 1: only Hero→Problem→Insight are wired (index clamped to MAX_WIRED);
 * later sections hold at Insight until Phase 2.
 *
 * REDUCED-MOTION / mobile (≤768px): controller disabled — the globe stays in
 * hero framing (identity transform), no travel.
 */
const MAX_WIRED = 2;

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduced || mobile) return; // globe hero-only, no travel

    let el: HTMLElement | null = null;
    let raf = 0;
    let last = performance.now();
    const cur = { tx: 0, ty: 0, scale: 1, bright: 1, opacity: 1, blur: 0 };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) {
        last = t;
        return;
      }
      if (!el) el = document.getElementById('globe-transform');
      if (!el) {
        last = t;
        return;
      }
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      const { activeSection, sectionProgress } = useSceneStore.getState();
      const a = Math.min(activeSection, MAX_WIRED);
      const from = SLOTS[a];
      const to = SLOTS[Math.min(a + 1, MAX_WIRED)];
      const tgt = lerpSlot(from, to, a < MAX_WIRED ? sectionProgress : 0);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const txTarget = (tgt.cx - 0.5 - (GLOBE_ORIGIN.x - 0.5) * tgt.scale) * vw;
      const tyTarget = (tgt.cy - 0.5 - (GLOBE_ORIGIN.y - 0.5) * tgt.scale) * vh;

      const k = 1 - Math.exp(-GLOBE_DAMP_LAMBDA * dt);
      cur.tx += (txTarget - cur.tx) * k;
      cur.ty += (tyTarget - cur.ty) * k;
      cur.scale += (tgt.scale - cur.scale) * k;
      cur.bright += (tgt.bright - cur.bright) * k;
      cur.opacity += (tgt.opacity - cur.opacity) * k;
      cur.blur += (tgt.blur - cur.blur) * k;

      el.style.transform = `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, 0) scale(${cur.scale.toFixed(4)})`;
      el.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      el.style.opacity = cur.opacity.toFixed(3);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
