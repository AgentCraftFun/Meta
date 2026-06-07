'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import {
  GLOBE_BUILD_TAG,
  SLOTS,
  buildAnchors,
  getScroll,
  getSections,
  globeTransform,
  scrollToT,
  slotAt,
} from './globeSlots';

/**
 * THE TRAVELLING GLOBE — smooth animated travel.
 *
 * PER FRAME:  scroll (Lenis, single source) → continuous float t (cached
 * anchors) → slotAt(t) eased target (dwell plateau: rests on each tuned slot
 * while its section is centred, then glides through the gap; log-scale; arc on
 * long traverses) → exponential damp toward it (converge-and-stop).
 *
 * The damped travel index is published to the store so CameraRig rotates the
 * globe as it travels (scroll-linked spin) on top of its ambient spin. The
 * CAMERA itself stays locked to the hero waypoint — only the globe rotates.
 *
 * Shares its entire model (buildAnchors / scrollToT / slotAt / globeTransform)
 * with the GlobePlacer overlay, so the tuning preview and the live page match.
 *
 * Stability: single scroll source; anchors + base size cached on mount/resize
 * only (never read layout in-loop); dt clamped; one rAF (StrictMode-guarded).
 * REDUCED-MOTION / mobile (≤768px): parked at the hero slot, no loop.
 */

const FAST_BLUR_SKIP = 40;
const EPS_FRAC = 0.0004;
const EPS_SCALE = 0.0005;
const EPS_FILTER = 0.002;
const MAX_DT = 1 / 30;

let LOOP_ACTIVE = false;

/** Damp one channel toward its target, snapping (and stopping) within eps. */
function damp(curV: number, tgtV: number, k: number, eps: number): number {
  if (Math.abs(tgtV - curV) < eps) return tgtV;
  return curV + (tgtV - curV) * k;
}

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;

    // eslint-disable-next-line no-console
    console.info(`[globe] BUILD ${GLOBE_BUILD_TAG} — smooth travel + rotation`);

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let baseW = vw;
    let baseH = vh;
    let anchors: number[] = [];
    let gEl: HTMLElement | null = null;

    const findEl = (): HTMLElement | null => {
      if (!gEl) gEl = document.getElementById('globe-transform');
      return gEl;
    };

    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      const g = findEl();
      if (g) {
        baseW = g.offsetWidth || vw;
        baseH = g.offsetHeight || vh;
      }
      anchors = buildAnchors(getSections(), vh, getScroll());
    };

    // ---- REDUCED-MOTION / MOBILE: park at hero slot, no loop -------------
    if (reduced || mobile) {
      const apply = () => {
        const g = findEl();
        if (!g) return;
        measure();
        const s = SLOTS[0];
        g.style.transform = globeTransform(s.cx, s.cy, s.scale, vw, vh, baseW, baseH);
        g.style.filter = `brightness(${s.bright})`;
        g.style.opacity = String(s.opacity);
      };
      apply();
      const t0 = window.setTimeout(apply, 200);
      window.addEventListener('resize', apply);
      return () => {
        window.clearTimeout(t0);
        window.removeEventListener('resize', apply);
      };
    }

    if (LOOP_ACTIVE) {
      // eslint-disable-next-line no-console
      console.warn('[globe] second rAF loop blocked (StrictMode/HMR double-mount).');
    }
    LOOP_ACTIVE = true;

    measure();
    const settle = window.setTimeout(measure, 300);
    window.addEventListener('load', measure);

    const s0 = SLOTS[0];
    const cur = {
      cx: s0.cx, cy: s0.cy, scale: s0.scale,
      bright: s0.bright, opacity: s0.opacity, blur: s0.blur, feather: s0.feather,
      travel: 0,
    };

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);

      // The ?place overlay owns the transform while tuning — stand down.
      if ((window as unknown as { __globePlace?: unknown }).__globePlace) {
        last = now;
        return;
      }
      if (document.hidden) {
        last = now;
        return;
      }
      const g = findEl();
      if (!g || anchors.length === 0) {
        last = now;
        if (anchors.length === 0) measure();
        return;
      }

      let dt = (now - last) / 1000;
      last = now;
      if (dt <= 0) return;
      if (dt > MAX_DT) dt = MAX_DT;

      const P = getScroll();
      const tt = scrollToT(P, anchors);
      const tgt = slotAt(tt, SLOTS);

      const { scrollVelocity } = useSceneStore.getState();
      const blurTarget = Math.abs(scrollVelocity) > FAST_BLUR_SKIP ? 0 : tgt.blur;

      const k = 1 - Math.exp(-GLOBE_DAMP_LAMBDA * dt);
      cur.cx = damp(cur.cx, tgt.cx, k, EPS_FRAC);
      cur.cy = damp(cur.cy, tgt.cy, k, EPS_FRAC);
      cur.scale = damp(cur.scale, tgt.scale, k, EPS_SCALE);
      cur.bright = damp(cur.bright, tgt.bright, k, EPS_FILTER);
      cur.opacity = damp(cur.opacity, tgt.opacity, k, EPS_FILTER);
      cur.blur = damp(cur.blur, blurTarget, k, EPS_FILTER);
      cur.feather = damp(cur.feather, tgt.feather, k, EPS_FILTER);
      // travel index is NOT snapped — it must keep feeding the scroll-linked
      // rotation smoothly across the whole page.
      cur.travel += (tt - cur.travel) * k;

      g.style.transform = globeTransform(cur.cx, cur.cy, cur.scale, vw, vh, baseW, baseH);
      g.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      g.style.opacity = cur.opacity.toFixed(3);

      // Publish damped travel index → CameraRig spins the globe as it travels.
      useSceneStore.getState().setGlobeTravel(cur.travel);
    };

    raf = requestAnimationFrame(loop);

    let rt: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (rt) clearTimeout(rt);
      rt = setTimeout(measure, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      LOOP_ACTIVE = false;
      if (rt) clearTimeout(rt);
      window.clearTimeout(settle);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', measure);
    };
  }, []);

  return null;
}
