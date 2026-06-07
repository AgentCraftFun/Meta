'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { GLOBE_DIAM_VH, GLOBE_ORIGIN, SLOTS, featherMask, lerpSlot, type Slot } from './globeSlots';

/**
 * The travelling globe. ONE rAF loop damps the #globe-transform wrapper toward
 * the slot for wherever the page is scrolled.
 *
 * TARGETING: the globe sits exactly on slot[i] when section i's CENTER is at the
 * viewport center, and glides slot[i]→slot[i+1] as you scroll between their
 * centers. (Previously it used per-section progress which is 0.5 at center — that
 * left the hero stuck halfway to the Problem slot, shrunk + boxed.)
 *
 * Applies transform (translate3d+scale), filter (brightness/blur), opacity, and
 * a radial feather mask so scaled-down slots are clean soft discs (feather ≥100
 * → no mask = full-bleed for hero + dim backdrops).
 *
 * Product (section 3): target taken from the live panel cutout's rect so the
 * globe sits framed INSIDE the panel.
 *
 * REDUCED-MOTION / mobile (≤768px): disabled — globe stays in hero framing.
 */
const PRODUCT_SECTION = 3;
const FAST_BLUR_SKIP = 40;

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
    let maskWritten = -999;
    const cur = { tx: 0, ty: 0, scale: 1, bright: 1, opacity: 1, blur: 0, feather: SLOTS[0].feather };

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
      const vc = vh / 2;

      // Continuous section position from each section's center vs viewport center.
      const centers = sections.map((s) => {
        const r = s.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      let i = 0;
      for (let k = 0; k < centers.length; k++) {
        if (centers[k] <= vc) i = k;
      }
      let frac = 0;
      if (i < centers.length - 1) {
        const span = centers[i + 1] - centers[i];
        frac = span > 0 ? (vc - centers[i]) / span : 0;
        frac = frac < 0 ? 0 : frac > 1 ? 1 : frac;
      }
      const f = i + frac; // continuous index

      let tgt: Slot = lerpSlot(SLOTS[i], SLOTS[Math.min(i + 1, SLOTS.length - 1)], frac);

      // Product: lock to the live panel cutout when it's the dominant section.
      const dominant = Math.round(f);
      if (dominant === PRODUCT_SECTION) {
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
            feather: 60,
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

      el.style.transform = `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, 0) scale(${cur.scale.toFixed(4)})`;
      el.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      el.style.opacity = cur.opacity.toFixed(3);

      // feather ≥100 → no mask (full-bleed). else radial disc. Throttled.
      if (Math.abs(cur.feather - maskWritten) > 0.5) {
        const m = cur.feather >= 100 ? 'none' : featherMask(cur.feather);
        el.style.setProperty('mask-image', m);
        el.style.setProperty('-webkit-mask-image', m);
        maskWritten = cur.feather;
      }
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
