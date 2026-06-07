'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { GLOBE_DIAM_VH, GLOBE_ORIGIN, SLOTS, featherMask, lerpSlot, type Slot } from './globeSlots';

/**
 * The travelling globe. ONE rAF loop damps the #globe-transform wrapper toward
 * the active slot (GLOBE_DAMP_LAMBDA) using activeSection + sectionProgress.
 *
 * Applies transform (translate3d + scale), filter (brightness/blur), opacity,
 * and the radial feather mask (so every slot is a clean soft-edged disc). The
 * mask string is only re-written when it changes meaningfully (throttled).
 *
 * Product (section 3): the target is taken from the live panel cutout's rect so
 * the globe sits framed INSIDE the panel as it scrolls.
 *
 * REDUCED-MOTION / mobile (≤768px): controller disabled — globe hero framing.
 */
const PRODUCT_SECTION = 3;
const FAST_BLUR_SKIP = 40;

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduced || mobile) return; // globe hero-only, no travel

    let el: HTMLElement | null = null;
    let cutout: HTMLElement | null = null;
    let raf = 0;
    let last = performance.now();
    let maskWritten = -1;
    const cur = { tx: 0, ty: 0, scale: 1, bright: 1, opacity: 1, blur: 0, feather: SLOTS[0].feather };

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

      const { activeSection, sectionProgress, scrollVelocity } = useSceneStore.getState();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const a = Math.min(activeSection, SLOTS.length - 1);
      const from = SLOTS[a];
      const to = SLOTS[Math.min(a + 1, SLOTS.length - 1)];
      let tgt: Slot = lerpSlot(from, to, sectionProgress);

      // Product: lock the globe to the live panel cutout (framed in the panel).
      if (activeSection === PRODUCT_SECTION) {
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
            feather: 50,
          };
        }
      }

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

      el.style.transform = `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, 0) scale(${cur.scale.toFixed(4)})`;
      el.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      el.style.opacity = cur.opacity.toFixed(3);

      // Re-write the feather mask only when it shifts meaningfully (throttled).
      if (Math.abs(cur.feather - maskWritten) > 0.5) {
        const m = featherMask(cur.feather);
        el.style.setProperty('mask-image', m);
        el.style.setProperty('-webkit-mask-image', m);
        maskWritten = cur.feather;
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
