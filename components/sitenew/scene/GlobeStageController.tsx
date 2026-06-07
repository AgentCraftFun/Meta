'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { GLOBE_DIAM_VH, GLOBE_ORIGIN, SLOTS, lerpSlot, type Slot } from './globeSlots';

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
const PRODUCT_SECTION = 3;
const FAST_BLUR_SKIP = 40;

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
    let cutout: HTMLElement | null = null;
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
      const BAND = 0.5 * vh;
      const n = sections.length;

      const rects = sections.map((s) => s.getBoundingClientRect());
      // current section = last whose top is at/above the viewport centre
      let i = 0;
      for (let kk = 0; kk < n; kk++) {
        if (rects[kk].top <= center) i = kk;
      }
      // scrub toward the next slot in the band before section i's bottom boundary
      let frac = 0;
      if (i < n - 1) {
        const boundary = rects[i].bottom;
        if (center > boundary - BAND) {
          frac = smoothstep((center - (boundary - BAND)) / BAND);
        }
      }
      const f = i + frac; // continuous travel index

      let tgt: Slot = lerpSlot(SLOTS[i], SLOTS[Math.min(i + 1, n - 1)], frac);

      // Product: lock to the live panel cutout when it's the dominant section.
      if (Math.round(f) === PRODUCT_SECTION) {
        if (!cutout) cutout = document.getElementById('product-globe-cutout');
        const r = cutout?.getBoundingClientRect();
        if (r && r.width > 0) {
          tgt = {
            cx: (r.left + r.width / 2) / vw,
            cy: (r.top + r.height / 2) / vh,
            scale: r.height / (GLOBE_DIAM_VH * vh),
            bright: 1,
            opacity: 1,
            blur: 0,
            feather: 55,
          };
        }
      }

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
