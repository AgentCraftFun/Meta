'use client';

import { useEffect } from 'react';
import { GLOBE_DAMP_LAMBDA } from '../system/motion';
import { useSceneStore } from '../system/useSceneStore';
import { SLOTS, lerpSlot, type Slot } from './globeSlots';

/**
 * THE TRAVELLING GLOBE — one continuous, damped pipeline. No per-section
 * enter/exit triggers, no IntersectionObserver, no CSS transitions: those are
 * what made it snap. Exactly ONE rAF loop and ONE source of truth:
 *
 *   P  → global scroll position (Lenis writes its smoothed scroll straight to
 *        window.scrollY, so reading scrollY each frame IS the smoothed value;
 *        falls back to raw scrollY when Lenis is off).
 *   t  → a continuous FLOAT "section index": t=0 at hero top, t=1 when §1 is
 *        centred in the viewport, t=2 on §2, … Piecewise-linear between those
 *        scroll anchors, so t glides as you scroll (never a stepped integer).
 *        Clamped to [0, LAST_SECTION] so it can't drift into untuned slots.
 *   lerp → each frame we lerp the two slots t sits between (floor/ceil) by the
 *        fractional part of t → a target that's already smooth across the page.
 *   damp → exponential smoothing toward that target (lambda ~5) removes any
 *        residual stutter from scroll jitter.
 *
 * Everything (vw/vh, section rects, P) is read FRESH every frame — no pixel
 * position is ever cached across resizes. The loop runs every frame regardless
 * of whether scroll events fire, so sparse scroll events can't cause stutter.
 *
 * RENDER: only `transform: translate3d(x,y,0) scale(s)` (+ brightness/opacity/
 * blur filters) on #globe-transform, whose transform-origin is center center.
 * Because #globe-transform is a full-viewport element (inset-0) with the globe
 * rendered dead-centre inside it, translating by ((cx-0.5)*vw, (cy-0.5)*vh)
 * lands the globe's CENTER exactly at (cx*vw, cy*vh).
 *
 * REDUCED-MOTION / mobile (≤768px): no rAF, no damp — the globe is parked once
 * at the hero slot (re-applied on resize). A valid, non-broken static state.
 */

// Only §0–§4 are tuned this session; clamp travel so it never overshoots into
// the still-untuned §5+ slots.
const LAST_SECTION = 4;

// Above this scroll velocity, skip the (target) blur to keep fast scrolls crisp.
const FAST_BLUR_SKIP = 40;

export default function GlobeStageController() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;

    // ---- REDUCED-MOTION / MOBILE: park at hero slot, no animation. ----------
    if (reduced || mobile) {
      const apply = () => {
        const el = document.getElementById('globe-transform');
        if (!el) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const s = SLOTS[0];
        el.style.transform = `translate3d(${((s.cx - 0.5) * vw).toFixed(2)}px, ${((s.cy - 0.5) * vh).toFixed(2)}px, 0) scale(${s.scale})`;
        el.style.filter = `brightness(${s.bright})`;
        el.style.opacity = String(s.opacity);
      };
      apply();
      // Retry shortly in case the element mounts after this effect.
      const t0 = window.setTimeout(apply, 200);
      window.addEventListener('resize', apply);
      return () => {
        window.clearTimeout(t0);
        window.removeEventListener('resize', apply);
      };
    }

    // ---- CONTINUOUS TRAVEL --------------------------------------------------
    let el: HTMLElement | null = null;
    let sections: HTMLElement[] = [];
    let raf = 0;
    let last = performance.now();

    // Start AT slot 0 so there's no scale/opacity pop on the first paint.
    const s0 = SLOTS[0];
    const cur = {
      tx: (s0.cx - 0.5) * window.innerWidth,
      ty: (s0.cy - 0.5) * window.innerHeight,
      scale: s0.scale,
      bright: s0.bright,
      opacity: s0.opacity,
      blur: s0.blur,
      feather: s0.feather,
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

      // --- fresh measurements every frame (never cached across resizes) -----
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const P = window.scrollY; // Lenis writes its smoothed scroll → scrollY

      // Scroll anchors (absolute doc px). anchor[0] = hero top (P=0); for every
      // other section the anchor is the scroll position at which that section is
      // CENTRED in the viewport. rect.top + P = the section's absolute top.
      const lastIdx = Math.min(LAST_SECTION, sections.length - 1);
      const anchors: number[] = [];
      for (let i = 0; i <= lastIdx; i++) {
        if (i === 0) {
          anchors[i] = 0;
          continue;
        }
        const r = sections[i].getBoundingClientRect();
        anchors[i] = r.top + P + r.height / 2 - vh / 2;
      }

      // --- P → continuous t (float section index), clamped to [0, lastIdx] ---
      let tt: number;
      if (P <= anchors[0]) {
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

      // --- lerp the two slots t sits between by its fractional part ----------
      const lo = Math.floor(tt);
      const hi = Math.min(lo + 1, lastIdx);
      const frac = tt - lo;

      // DEV PLACEMENT TOOL override (?place): merge into BOTH endpoints before
      // the lerp so the tool slides between sections exactly like production.
      const place = (window as unknown as {
        __globePlace?: Record<number, { cx: number; cy: number; scale: number }>;
      }).__globePlace;
      const slotA: Slot = place && place[lo] ? { ...SLOTS[lo], ...place[lo] } : SLOTS[lo];
      const slotB: Slot = place && place[hi] ? { ...SLOTS[hi], ...place[hi] } : SLOTS[hi];
      const tgt: Slot = lerpSlot(slotA, slotB, frac);

      // CENTER-origin translate: place the globe's centre at (cx*vw, cy*vh).
      const txTarget = (tgt.cx - 0.5) * vw;
      const tyTarget = (tgt.cy - 0.5) * vh;

      const { scrollVelocity } = useSceneStore.getState();
      const blurTarget = Math.abs(scrollVelocity) > FAST_BLUR_SKIP ? 0 : tgt.blur;

      // --- single damp toward the target (the only smoothing) ---------------
      const k = 1 - Math.exp(-GLOBE_DAMP_LAMBDA * dt);
      cur.tx += (txTarget - cur.tx) * k;
      cur.ty += (tyTarget - cur.ty) * k;
      cur.scale += (tgt.scale - cur.scale) * k;
      cur.bright += (tgt.bright - cur.bright) * k;
      cur.opacity += (tgt.opacity - cur.opacity) * k;
      cur.blur += (blurTarget - cur.blur) * k;
      cur.feather += (tgt.feather - cur.feather) * k;
      cur.travel += (tt - cur.travel) * k;

      el.style.transform = `translate3d(${cur.tx.toFixed(2)}px, ${cur.ty.toFixed(2)}px, 0) scale(${cur.scale.toFixed(4)})`;
      el.style.filter =
        cur.blur > 0.05
          ? `brightness(${cur.bright.toFixed(3)}) blur(${cur.blur.toFixed(2)}px)`
          : `brightness(${cur.bright.toFixed(3)})`;
      el.style.opacity = cur.opacity.toFixed(3);

      // publish damped travel index for the in-scene spin (CameraRig reads it)
      useSceneStore.getState().setGlobeTravel(cur.travel);
    };

    raf = requestAnimationFrame(loop);

    // Re-query sections on resize (debounced); pixel positions themselves are
    // always recomputed in-loop, so nothing stale is cached across resizes.
    let rt: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (rt) clearTimeout(rt);
      rt = setTimeout(() => {
        sections = [];
      }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      if (rt) clearTimeout(rt);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
