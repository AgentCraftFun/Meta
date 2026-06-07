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
    // Start AT slot 0 so there's no scale/opacity pop on first paint (the globe
    // would otherwise damp from scale 1 up to the hero scale right as it loads).
    const cur = {
      tx: 0, ty: 0,
      scale: SLOTS[0].scale,
      bright: SLOTS[0].bright,
      opacity: SLOTS[0].opacity,
      blur: SLOTS[0].blur,
      feather: SLOTS[0].feather,
      travel: 0,
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
      // Length of the scroll-linked hand-off between two sections. The globe
      // DWELLS on a slot the rest of the time, so it sits perfectly still while
      // you read a section (no mid-section drift) and only travels during this
      // band, just before the next section's top reaches the viewport centre.
      const TRANS = 0.4 * vh;
      const n = sections.length;

      const rects = sections.map((s) => s.getBoundingClientRect());

      // Active section = the last one whose top has reached/passed the viewport
      // centre (same rule as ScrollDirector's "top center" trigger). The globe
      // rests on SLOTS[a] — dwell, not continuous drift.
      let a = 0;
      for (let i = 0; i < n; i++) {
        if (rects[i].top <= center + 0.5) a = i;
      }
      // Hand-off: in the final TRANS px before the NEXT section's top hits the
      // centre, blend toward the next slot. blend reaches 1 exactly as `a`
      // flips to a+1 (and that slot's blend restarts at 0), so it's seamless.
      const j = Math.min(a + 1, n - 1);
      let blend = 0;
      if (a < n - 1) {
        const d = rects[a + 1].top - center; // px the next boundary sits below centre
        blend = smoothstep(1 - d / TRANS); // 0 while dwelling → 1 at the hand-off
      }
      const f = a + blend; // continuous index, used only for the in-scene spin

      // DEV PLACEMENT TOOL override (only set when ?place is active). Apply it to
      // BOTH the current and next slot BEFORE the blend, so the tool interpolates
      // between sections exactly like production — a smooth slide, never a snap.
      const place = (window as unknown as { __globePlace?: Record<number, { cx: number; cy: number; scale: number }> }).__globePlace;
      const slotA: Slot = place && place[a] ? { ...SLOTS[a], ...place[a] } : SLOTS[a];
      const slotB: Slot = place && place[j] ? { ...SLOTS[j], ...place[j] } : SLOTS[j];
      const tgt: Slot = lerpSlot(slotA, slotB, blend);

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
