'use client';

import { useEffect } from 'react';

/**
 * DESKTOP SECTION-LOCKED SCROLL SNAPPING (/siteNEW).
 *
 * One wheel/key gesture = exactly ONE buttery transition to the adjacent
 * section, then it locks. Rather than translate a strip + feed a separate `p`
 * into the globe (which would break IntersectionObserver-based reveals, since
 * IO ignores CSS transforms), we make the **animated scroll position itself the
 * single source of truth**: a quint-eased tween moves `window.scroll` between
 * section CENTRES over 1.1s. The existing globe controller already reads scroll
 * → t → slotAt → damp, so the globe glides between its tuned slots in perfect
 * lockstep with the section pan — same motion, same 1.1s, no possible desync.
 * FadeUp reveals, the ticker, heartbeats and ambient loops keep running.
 *
 * GUARDRAILS:
 *   • Enabled ONLY on desktop + fine pointer + NOT reduced-motion (and not the
 *     ?place tuning tool). Everywhere else: untouched native / Lenis scroll.
 *   • Input is ignored while a transition runs (+150ms cooldown); a continuous
 *     trackpad flick keeps extending the cooldown so ONE flick = ONE move.
 *   • Keyboard: ↓/PageDown/Space = next, ↑/PageUp = prev, Home/End = first/last;
 *     never hijacked while a form field is focused.
 *   • The real scrollbar still reflects position (no fighting the browser); a
 *     scrollbar drag just re-syncs the active index on the next gesture.
 */

// ease-in-out-quint — cubic-bezier(0.83, 0, 0.17, 1): slow start, accelerate
// through the middle, long soft settle. The cinematic curve (no bounce).
const quint = (x: number): number =>
  x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;

const DURATION = 1100;
const COOLDOWN = 150;

export default function SnapScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const hasPlace = new URLSearchParams(window.location.search).has('place');
    // Desktop / fine-pointer only. RM, mobile/coarse, and ?place opt out.
    if (reduced || !fine || !wide || hasPlace) return;

    const docEl = document.documentElement;
    docEl.classList.add('sn-snap');
    // Snap-only: each section becomes a full screen (centred), and the browser's
    // own smooth-scroll is off so our tween is the only animation. Scoped to
    // .sn-snap, so reduced-motion / mobile layouts are completely untouched.
    const style = document.createElement('style');
    style.textContent =
      'html.sn-snap{scroll-behavior:auto}' +
      'html.sn-snap [data-sn-section]{min-height:100vh;display:flex;flex-direction:column;justify-content:center}';
    document.head.appendChild(style);

    let sections: HTMLElement[] = [];
    let anchors: number[] = []; // scroll position that centres each section
    let active = 0;
    let animating = false;
    let cooldownUntil = 0;
    let raf = 0;
    let pending = 0; // queued keyboard direction if a key arrives mid-transition

    const querySections = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-sn-section]')).sort(
        (a, b) => Number(a.dataset.snSection) - Number(b.dataset.snSection)
      );

    const nearest = (y: number): number => {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < anchors.length; i++) {
        const d = Math.abs(anchors[i] - y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    };

    const measure = () => {
      sections = querySections();
      const vh = window.innerHeight;
      const max = Math.max(0, document.documentElement.scrollHeight - vh);
      anchors = sections.map((s) => {
        const r = s.getBoundingClientRect();
        const centre = r.top + window.scrollY + r.height / 2 - vh / 2;
        return Math.min(max, Math.max(0, centre));
      });
      active = nearest(window.scrollY);
    };

    const animateTo = (idx: number) => {
      const n = sections.length;
      if (n === 0) return;
      idx = Math.max(0, Math.min(idx, n - 1));
      const from = window.scrollY;
      const to = anchors[idx];
      if (Math.abs(to - from) < 1) {
        active = idx;
        return;
      }
      animating = true;
      const start = performance.now();
      const step = (now: number) => {
        const e = Math.min(1, (now - start) / DURATION);
        window.scrollTo(0, from + (to - from) * quint(e));
        if (e < 1) {
          raf = requestAnimationFrame(step);
        } else {
          animating = false;
          active = idx;
          cooldownUntil = performance.now() + COOLDOWN;
          // Honour a direction queued during this transition (guardrail 5):
          // finish first, then move once more — never stack/cancel violently.
          if (pending !== 0) {
            const d = pending;
            pending = 0;
            window.setTimeout(() => go(d), COOLDOWN);
          }
        }
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    };

    // Step exactly one section in `dir` (±1). Re-derives the active index from
    // the live scroll position so a scrollbar drag can't desync us.
    const go = (dir: number) => {
      if (animating) return;
      active = nearest(window.scrollY);
      const target = Math.max(0, Math.min(active + dir, sections.length - 1));
      if (target === active) return;
      animateTo(target);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // no native free-scroll; we drive it
      const now = performance.now();
      if (animating) return;
      if (now < cooldownUntil) {
        cooldownUntil = now + COOLDOWN; // continuous flick keeps the lock → one move
        return;
      }
      if (Math.abs(e.deltaY) < 1) return;
      go(Math.sign(e.deltaY));
    };

    const isFormField = (t: EventTarget | null): boolean => {
      const el = t as HTMLElement | null;
      if (!el || !el.tagName) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    // Space / Enter activate the focused control — don't steal them from
    // buttons/links (keeps "Enter the terminal", skip link, etc. usable).
    const isInteractive = (t: EventTarget | null): boolean => {
      const el = t as HTMLElement | null;
      if (!el || !el.tagName) return false;
      const tag = el.tagName;
      return tag === 'BUTTON' || tag === 'A' || el.getAttribute?.('role') === 'button';
    };

    // Step ±1, but queue (don't drop) if a transition is mid-flight.
    const nav = (dir: number) => {
      if (animating) {
        pending = dir;
        return;
      }
      go(dir);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isFormField(e.target)) return;
      switch (e.key) {
        case ' ':
          if (isInteractive(e.target)) return; // let the button/link handle it
          e.preventDefault();
          nav(1);
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          nav(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          nav(-1);
          break;
        case 'Home':
          e.preventDefault();
          if (!animating) animateTo(0);
          break;
        case 'End':
          e.preventDefault();
          if (!animating) animateTo(sections.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    // Measure after layout settles (the snap CSS resizes every section to 100vh).
    measure();
    const t1 = window.setTimeout(measure, 200);
    const t2 = window.setTimeout(measure, 600);
    window.addEventListener('load', measure);
    let rt: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (rt) clearTimeout(rt);
      rt = setTimeout(() => {
        if (animating) {
          measure();
          return;
        }
        const cur = active;
        measure();
        // keep the same section centred across a resize (no lurch)
        const idx = Math.min(cur, anchors.length - 1);
        window.scrollTo(0, anchors[idx] ?? 0);
        active = idx;
      }, 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', measure);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (rt) clearTimeout(rt);
      docEl.classList.remove('sn-snap');
      style.remove();
    };
  }, []);

  return null;
}
