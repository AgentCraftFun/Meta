'use client';

import { useEffect } from 'react';
import { SLOTS, activeSection, globeTransform } from './globeSlots';

/**
 * THE TRAVELLING GLOBE — STATIC HARD-LOCK mode.
 *
 * No damping, no smoothstep, no dwell, no arc, no log-scale. Every frame we
 * find the section the viewport is on (the SAME `activeSection` the placer
 * uses) and write that slot's EXACT transform to #globe-transform. The globe
 * therefore sits on the precise tuned coordinate for whatever section you're
 * on, and snaps straight to the next slot when you cross into the next section.
 *
 * This is the verification baseline: once the four positions read correctly we
 * can reintroduce eased motion between them on top of this exact mapping.
 *
 * Writing the (constant) transform every frame keeps the globe locked even if
 * anything else tries to touch it, and stays correct across resizes because vw/
 * vh/baseW/baseH are read fresh each write.
 *
 * REDUCED-MOTION / mobile (≤768px): parked at the hero slot.
 */

let LOOP_ACTIVE = false;

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const DEBUG = new URLSearchParams(window.location.search).has('globedebug');

    let gEl: HTMLElement | null = null;
    const findEl = (): HTMLElement | null => {
      if (!gEl) gEl = document.getElementById('globe-transform');
      return gEl;
    };

    // Write a slot's exact transform — no interpolation, no animation.
    const applyStatic = (idx: number) => {
      const g = findEl();
      if (!g) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const baseW = g.offsetWidth || vw;
      const baseH = g.offsetHeight || vh;
      const s = SLOTS[idx];
      g.style.transform = globeTransform(s.cx, s.cy, s.scale, vw, vh, baseW, baseH);
      g.style.filter =
        s.blur > 0.05 ? `brightness(${s.bright}) blur(${s.blur}px)` : `brightness(${s.bright})`;
      g.style.opacity = String(s.opacity);
    };

    // ---- REDUCED-MOTION / MOBILE: park at hero slot ----------------------
    if (reduced || mobile) {
      const apply = () => applyStatic(0);
      apply();
      const t0 = window.setTimeout(apply, 200);
      window.addEventListener('resize', apply);
      return () => {
        window.clearTimeout(t0);
        window.removeEventListener('resize', apply);
      };
    }

    // ---- single-loop guard ----------------------------------------------
    if (LOOP_ACTIVE) {
      // eslint-disable-next-line no-console
      console.warn('[globe] second rAF loop blocked (StrictMode/HMR double-mount).');
    }
    LOOP_ACTIVE = true;

    let raf = 0;
    let lastIdx = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      // The ?place overlay owns the transform while tuning — stand down.
      if ((window as unknown as { __globePlace?: unknown }).__globePlace) return;
      if (document.hidden) return;

      const idx = activeSection();
      applyStatic(idx); // HARD LOCK — snap straight to the exact slot

      if (idx !== lastIdx) {
        lastIdx = idx;
        if (DEBUG) {
          const s = SLOTS[idx];
          // eslint-disable-next-line no-console
          console.log(`[globe] LOCK §${idx} → cx=${s.cx} cy=${s.cy} scale=${s.scale}`);
        }
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      LOOP_ACTIVE = false;
    };
  }, []);

  return null;
}
