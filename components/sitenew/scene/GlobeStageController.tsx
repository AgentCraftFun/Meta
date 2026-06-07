'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import {
  SLOTS,
  globeTransform,
  globeCenterPx,
  buildAnchors,
  getScroll,
  getSections,
  scrollToT,
  slotAt,
} from './globeSlots';

/**
 * THE TRAVELLING GLOBE — runtime side. It shares its ENTIRE travel model with
 * the GlobePlacer overlay (buildAnchors / scrollToT / slotAt in globeSlots), so
 * "what you tune is exactly what ships". The only thing this file adds on top of
 * the shared target is a damp toward it.
 *
 * PER FRAME:
 *   scroll (ONE source: Lenis.scroll) → t (continuous float section index, from
 *   CACHED anchors) → slotAt(t) = TARGET (dwell-eased, log-scale, arc) → damp.
 *
 * The dwell plateau in slotAt means the globe SITS exactly on a slot while its
 * section is centred, so pausing on a section never drifts and the live position
 * matches the placer's tuned coordinates exactly.
 *
 * STABILITY: single scroll source; anchors + base size cached on mount/resize
 * only (never read layout in-loop); converge-and-stop snap; dt clamped; exactly
 * one rAF, guarded against StrictMode/HMR double-mount.
 *
 * REDUCED-MOTION / mobile (≤768px): parked at the hero slot, no loop.
 */

const FAST_BLUR_SKIP = 40;
const EPS_FRAC = 0.0004;
const EPS_SCALE = 0.0005;
const EPS_FILTER = 0.002;
const MAX_DT = 1 / 30;

let LOOP_ACTIVE = false;

function damp(curV: number, tgtV: number, k: number, eps: number): number {
  if (Math.abs(tgtV - curV) < eps) return tgtV;
  return curV + (tgtV - curV) * k;
}

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const DEBUG = new URLSearchParams(window.location.search).has('globedebug');

    // ---- cached measurements (mount + resize ONLY) ----------------------
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
        baseW = g.offsetWidth || vw; // un-transformed layout size (no feedback)
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

    // ---- single-loop guard ----------------------------------------------
    if (LOOP_ACTIVE) {
      // eslint-disable-next-line no-console
      console.warn('[globe] second rAF loop blocked (StrictMode/HMR double-mount).');
    }
    LOOP_ACTIVE = true;

    measure();
    const settle = window.setTimeout(measure, 300);
    window.addEventListener('load', measure);

    if (DEBUG) {
      const cAt1 = globeCenterPx(SLOTS[0].cx, vw, baseW, 1);
      const cAt2 = globeCenterPx(SLOTS[0].cx, vw, baseW, 2);
      // eslint-disable-next-line no-console
      console.info(
        `[globe] scroll source = ${(window as unknown as { __lenis?: unknown }).__lenis ? 'Lenis.scroll' : 'window.scrollY'}`
      );
      // eslint-disable-next-line no-console
      console.info(
        `[globe] centre invariant: scale1=${cAt1.toFixed(2)} scale2=${cAt2.toFixed(2)} → ${cAt1 === cAt2 ? 'EQUAL (scale-independent)' : 'MISMATCH'}`
      );
    }

    const s0 = SLOTS[0];
    const cur = {
      cx: s0.cx, cy: s0.cy, scale: s0.scale,
      bright: s0.bright, opacity: s0.opacity, blur: s0.blur, feather: s0.feather,
      travel: 0,
    };

    let raf = 0;
    let last = performance.now();
    let dbg = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);

      // The ?place overlay OWNS the transform while tuning — stand down.
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
      const tt = scrollToT(P, anchors); // continuous, cached anchors → pure fn of P
      const tgt = slotAt(tt, SLOTS); // shared with the placer

      const { scrollVelocity } = useSceneStore.getState();
      const blurTarget = Math.abs(scrollVelocity) > FAST_BLUR_SKIP ? 0 : tgt.blur;

      if (DEBUG && dbg < 120) {
        dbg++;
        // eslint-disable-next-line no-console
        console.log(
          `[globe] f${dbg} P=${P.toFixed(1)} t=${tt.toFixed(4)} cx=${tgt.cx.toFixed(4)} cy=${tgt.cy.toFixed(4)} s=${tgt.scale.toFixed(4)}`
        );
      }

      const k = 1 - Math.exp(-GLOBE_DAMP_LAMBDA * dt);
      cur.cx = damp(cur.cx, tgt.cx, k, EPS_FRAC);
      cur.cy = damp(cur.cy, tgt.cy, k, EPS_FRAC);
      cur.scale = damp(cur.scale, tgt.scale, k, EPS_SCALE);
      cur.bright = damp(cur.bright, tgt.bright, k, EPS_FILTER);
      cur.opacity = damp(cur.opacity, tgt.opacity, k, EPS_FILTER);
      cur.blur = damp(cur.blur, blurTarget, k, EPS_FILTER);
      cur.feather = damp(cur.feather, tgt.feather, k, EPS_FILTER);
      cur.travel = damp(cur.travel, tt, k, EPS_FRAC);

      g.style.transform = globeTransform(cur.cx, cur.cy, cur.scale, vw, vh, baseW, baseH);
      g.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      g.style.opacity = cur.opacity.toFixed(3);

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
