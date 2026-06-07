'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { SLOTS, globeTransform, globeCenterPx, type Slot } from './globeSlots';

/**
 * THE TRAVELLING GLOBE — one continuous, damped pipeline that converges and
 * then goes perfectly still. ONE rAF loop, ONE scroll source, ONE transform
 * math (globeTransform, shared with the GlobePlacer overlay).
 *
 * PER FRAME:  P (single scroll source) → t (float section index, pure fn of P
 * from CACHED anchors) → lerp adjacent slots = TARGET → exponential damp with a
 * convergence snap. The target is a pure function of P, so when scroll is idle
 * the target is byte-identical every frame and the globe stops dead.
 *
 * STABILITY RULES (kill idle/scroll jitter):
 *   • Single scroll source: Lenis.scroll if present, else window.scrollY. Never
 *     mixed (mixing them on alternating frames is the classic idle jitter).
 *   • Section breakpoints + base size measured ONCE on mount + on (debounced)
 *     resize and cached. We NEVER read layout (getBoundingClientRect / offset*)
 *     of any element inside the loop — that both jitters and reflows.
 *   • Converge-then-stop: once |target-current| < EPS we snap to target and add
 *     no further sub-pixel noise.
 *   • dt clamped (≤1/30s) so a backgrounded tab can't explode on refocus.
 *   • Exactly ONE rAF, guarded against StrictMode/HMR double-mount.
 *
 * REDUCED-MOTION / mobile (≤768px): no rAF, no damp — parked at the hero slot.
 */

// Only §0–§4 are tuned this session; clamp travel so it never drifts into the
// still-untuned §5+ slots.
const LAST_SECTION = 4;
// Above this scroll velocity, drop the (target) blur to keep fast scrolls crisp.
const FAST_BLUR_SKIP = 40;
// Convergence epsilons (snap-and-stop). Fractions for cx/cy so it's resolution-
// independent (~0.3px at 1080p); small absolutes for the rest.
const EPS_FRAC = 0.0004;
const EPS_SCALE = 0.0005;
const EPS_FILTER = 0.002;
const MAX_DT = 1 / 30;
// Long horizontal traverses (|Δcx| over this) get a shallow arc so they read
// like an orbit, not a whip. Endpoints are untouched (sin(0)=sin(π)=0).
const ARC_DCX = 0.4;
const ARC_AMOUNT = 0.06;

const lerp = (a: number, b: number, e: number): number => a + (b - a) * e;
/** smoothstep — eases in AND out, zero velocity at both ends. */
const smoothstep = (x: number): number => {
  const c = x < 0 ? 0 : x > 1 ? 1 : x;
  return c * c * (3 - 2 * c);
};

// Module-level guard: a StrictMode / HMR double-mount must not start a 2nd loop.
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
    const DEBUG = new URLSearchParams(window.location.search).has('globedebug');

    // ---- single scroll source -------------------------------------------
    const getScroll = (): number => {
      const lenis = (window as unknown as { __lenis?: { scroll: number } }).__lenis;
      return lenis ? lenis.scroll : window.scrollY;
    };

    // ---- cached measurements (mount + resize ONLY — never per-frame) ------
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let baseW = vw;
    let baseH = vh;
    let anchors: number[] = []; // absolute doc-scroll px at which t === index
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
        // offsetWidth/Height = un-transformed LAYOUT size (ignores our scale),
        // so reading it is not layout feedback.
        baseW = g.offsetWidth || vw;
        baseH = g.offsetHeight || vh;
      }
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('[data-sn-section]')
      ).sort((a, b) => Number(a.dataset.snSection) - Number(b.dataset.snSection));
      const scroll = getScroll();
      const lastIdx = Math.min(LAST_SECTION, sections.length - 1);
      const next: number[] = [];
      for (let i = 0; i <= lastIdx; i++) {
        if (i === 0) {
          next[i] = 0; // hero top
          continue;
        }
        const r = sections[i].getBoundingClientRect();
        // absolute doc-scroll position at which section i is CENTRED.
        next[i] = r.top + scroll + r.height / 2 - vh / 2;
      }
      anchors = next;
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
    // Re-measure after layout settles (fonts / boot overlay can shift offsets).
    const settle = window.setTimeout(measure, 300);
    window.addEventListener('load', measure);

    if (DEBUG) {
      // Prove the rendered centre is scale-independent (BUG-1 invariant).
      const cAt1 = globeCenterPx(SLOTS[0].cx, vw, baseW, 1);
      const cAt2 = globeCenterPx(SLOTS[0].cx, vw, baseW, 2);
      // eslint-disable-next-line no-console
      console.info(
        `[globe] scroll source = ${(window as unknown as { __lenis?: unknown }).__lenis ? 'Lenis.scroll' : 'window.scrollY'}`
      );
      // eslint-disable-next-line no-console
      console.info(
        `[globe] centre invariant: scale1=${cAt1.toFixed(2)}px scale2=${cAt2.toFixed(2)}px → ${cAt1 === cAt2 ? 'EQUAL (scale-independent)' : 'MISMATCH'}`
      );
    }

    // damped state in SLOT space (cx/cy/scale/...), started AT slot 0 to avoid
    // a first-paint pop. Rendered via the SAME globeTransform the placer uses.
    const s0 = SLOTS[0];
    const cur = {
      cx: s0.cx, cy: s0.cy, scale: s0.scale,
      bright: s0.bright, opacity: s0.opacity, blur: s0.blur, feather: s0.feather,
      travel: 0,
    };

    // Pure function of P: → { eased slot target, float index t }.
    // Pipeline: P → continuous t → smoothstep the fractional part → interpolate
    // (cx/cy linear, scale in LOG space) → shallow arc on long traverses.
    const targetFor = (P: number): { s: Slot; t: number } => {
      const lastIdx = anchors.length - 1;
      let tt: number;
      if (lastIdx <= 0 || P <= anchors[0]) {
        tt = 0;
      } else {
        tt = lastIdx;
        for (let i = 0; i < lastIdx; i++) {
          if (P < anchors[i + 1]) {
            const span = anchors[i + 1] - anchors[i];
            const f = span > 0 ? (P - anchors[i]) / span : 0;
            tt = i + (f < 0 ? 0 : f > 1 ? 1 : f);
            break;
          }
        }
      }
      const lo = Math.floor(tt);
      const hi = Math.min(lo + 1, Math.max(lastIdx, 0));
      const a = SLOTS[lo];
      const b = SLOTS[hi];
      const e = smoothstep(tt - lo); // eases out of A and into B

      const cx = lerp(a.cx, b.cx, e);
      let cy = lerp(a.cy, b.cy, e);
      // LOG-space scale so a big shrink/grow (e.g. B 0.900 → D 0.410) reads
      // perceptually even instead of lurching.
      const scale = Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), e));
      // Shallow orbital arc on long horizontal traverses (e.g. B→C). Vanishes
      // at both endpoints, so the globe still lands exactly on the tuned cy.
      if (Math.abs(b.cx - a.cx) > ARC_DCX) {
        cy += -ARC_AMOUNT * Math.sin(Math.PI * e);
      }

      const s: Slot = {
        cx,
        cy,
        scale,
        bright: lerp(a.bright, b.bright, e),
        opacity: lerp(a.opacity, b.opacity, e),
        blur: lerp(a.blur, b.blur, e),
        feather: lerp(a.feather, b.feather, e),
      };
      return { s, t: tt };
    };

    let raf = 0;
    let last = performance.now();
    let dbg = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);

      // While the ?place overlay is up it OWNS the transform — stand down so the
      // two never fight (which would look like random jumps).
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
      const { s: tgt, t: tt } = targetFor(P);

      const { scrollVelocity } = useSceneStore.getState();
      const blurTarget = Math.abs(scrollVelocity) > FAST_BLUR_SKIP ? 0 : tgt.blur;

      if (DEBUG && dbg < 120) {
        dbg++;
        // eslint-disable-next-line no-console
        console.log(
          `[globe] f${dbg} P=${P.toFixed(1)} t=${tt.toFixed(4)} target cx=${tgt.cx.toFixed(4)} cy=${tgt.cy.toFixed(4)} s=${tgt.scale.toFixed(4)}`
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

    // Resize: recompute vw/vh + base size + breakpoints (debounced). cur stays
    // in fraction space, so the next frame re-anchors smoothly (no lurch).
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
