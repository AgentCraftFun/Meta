'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { GLOBE_ORIGIN, SLOTS, lerpSlot, type Slot } from './globeSlots';

/**
 * The travelling globe. ONE rAF loop damps the #globe-transform wrapper toward
 * the slot for wherever the page is scrolled.
 *
 * TARGETING (boundary-band, height-independent): the globe DWELLS on slot[i]
 * while section i fills the viewport, then scrubs slot[i]→slot[i+1] across a
 * band as section i's bottom boundary crosses the viewport centre. This works
 * regardless of section height (fixes the tall-Insight lag).
 *
 * SHAPE: clip-path circle (not mask-image — that was unreliable with
 * filter+transform). The canvas clears to #05080F so the clip edge is invisible.
 *
 * SPIN: writes a damped continuous travel index to the store; CameraRig turns
 * the globe by it, so the globe visibly rotates as it travels.
 *
 * Product (section 3): target taken from the live panel cutout's rect.
 *
 * REDUCED-MOTION / mobile (≤768px): disabled — globe stays in hero framing.
 */
const FAST_BLUR_SKIP = 40;

/** TEMP debug readout — surfaced on-screen by <GlobeDebug> for diagnosis. */
export const globeDebug = {
  f: 0,
  scale: 0,
  tx: 0,
  ty: 0,
  opacity: 1,
  n: 0,
  tops: '',
};

function smoothstep(x: number): number {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
}

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduced || mobile) return;

    let el: HTMLElement | null = null;
    let sections: HTMLElement[] = [];
    let raf = 0;
    let last = performance.now();
    const cur = {
      tx: 0, ty: 0, scale: 1, bright: 1, opacity: 1, blur: 0, feather: SLOTS[0].feather, travel: 0,
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) {
        last = t;
        return;
      }
      if (!el) el = document.getElementById('globe-transform');
      if (sections.length === 0) {
        sections = Array.from(
          document.querySelectorAll<HTMLElement>('[data-sn-section]')
        ).sort((a, b) => Number(a.dataset.snSection) - Number(b.dataset.snSection));
      }
      if (!el || sections.length === 0) {
        last = t;
        return;
      }
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const center = vh / 2;
      const BAND = 0.3 * vh; // tighter band → each section dwells at its slot longer
      const n = sections.length;

      const rects = sections.map((s) => s.getBoundingClientRect());
      // Continuous travel index: SUM how far each section boundary has crossed
      // the viewport centre (each contributes 0→1 over a ±BAND window, centred
      // on the boundary hitting screen centre). No section-flip → no jump/glitch.
      let f = 0;
      for (let b = 0; b < n - 1; b++) {
        const boundaryY = rects[b + 1].top; // viewport-y of boundary b↔b+1
        f += smoothstep((center - boundaryY + BAND) / (2 * BAND));
      }
      f = Math.max(0, Math.min(n - 1, f));
      const i0 = Math.floor(f);
      const i1 = Math.min(i0 + 1, n - 1);
      const tgt: Slot = lerpSlot(SLOTS[i0], SLOTS[i1], f - i0);

      // (Product cutout rect-tracking removed for now — it could size the globe
      //  to the small panel cell and was the likely "tiny glitch". Product uses
      //  its plain slot until hero/problem/insight are dialled in.)

      const { scrollVelocity } = useSceneStore.getState();
      const blurTarget = Math.abs(scrollVelocity) > FAST_BLUR_SKIP ? 0 : tgt.blur;
      const txTarget = (tgt.cx - 0.5 - (GLOBE_ORIGIN.x - 0.5) * tgt.scale) * vw;
      const tyTarget = (tgt.cy - 0.5 - (GLOBE_ORIGIN.y - 0.5) * tgt.scale) * vh;

      const k = 1 - Math.exp(-GLOBE_DAMP_LAMBDA * dt);
      cur.tx += (txTarget - cur.tx) * k;
      cur.ty += (tyTarget - cur.ty) * k;
      cur.scale += (tgt.scale - cur.scale) * k;
      cur.bright += (tgt.bright - cur.bright) * k;
      cur.opacity += (tgt.opacity - cur.opacity) * k;
      cur.blur += (blurTarget - cur.blur) * k;
      cur.feather += (tgt.feather - cur.feather) * k;
      cur.travel += (f - cur.travel) * k;

      el.style.transform = `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, 0) scale(${cur.scale.toFixed(4)})`;
      el.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      el.style.opacity = cur.opacity.toFixed(3);

      // publish damped travel index for the in-scene spin
      useSceneStore.getState().setGlobeTravel(cur.travel);

      // TEMP debug
      globeDebug.f = f;
      globeDebug.scale = cur.scale;
      globeDebug.tx = cur.tx;
      globeDebug.ty = cur.ty;
      globeDebug.opacity = cur.opacity;
      globeDebug.n = n;
      globeDebug.tops = rects.map((r) => Math.round(r.top)).join(',');
    };

    raf = requestAnimationFrame(loop);
    const onResize = () => {
      sections = [];
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
