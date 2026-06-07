'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { clamp01, easeExpoOut, easeQuintInOut } from './easing';
import { isSnapEnabled, onSnapModeChange } from './snapMode';
import { useSceneStore } from './useSceneStore';

/**
 * SECTION-LOCKED SCROLL SNAP (desktop / fine-pointer only).
 *
 * The page does NOT free-scroll. It locks to one section at a time; a single
 * wheel / key / swipe gesture triggers ONE buttery transition to the adjacent
 * section, then locks there. Everything is driven from ONE animated progress
 * value `p` that tweens current→target over 1.1s on the cinematic ease-in-out
 * quint curve, so nothing can desync:
 *
 *   1. The section strip translates to `-p · 100vh` (one GPU transform).
 *   2. `p` is published as store.snapProgress; the GlobeStageController feeds it
 *      to slotAtSmooth so the globe glides between its tuned slots across the
 *      SAME 1.1s — the globe travel and the section pan are the same motion.
 *   3. Each section's content reveals from a continuous "centredness" derived
 *      from `p` (opacity over 0.3→0.8, translateY 32→0, expoOut), reversing
 *      symmetrically as it leaves.
 *
 * GUARDRAILS: disabled under prefers-reduced-motion and on mobile / coarse
 * pointer / <768px (native scroll + the existing static/scroll globe take over).
 * Keyboard a11y (arrows / PageUp·Down / Space / Home / End), tab-order focus
 * recovery, hash sync, and end-clamping are all handled. Ambient loops (ticker,
 * heartbeats, reveals) keep running — this only governs navigation.
 *
 * In non-snap mode this component is an inert pass-through wrapper: the viewport
 * / strip render as plain blocks and the children stack and scroll natively.
 */

const DURATION = 1.1; // seconds — the cinematic transition length
const COOLDOWN = 150; // ms lock after a transition before the next gesture
const GESTURE_GAP = 120; // ms quiet needed before a wheel stream counts as new
const WHEEL_MIN = 2; // px — ignore sub-pixel wheel noise
const SWIPE_MIN = 40; // px — min touch travel to count as a swipe
const REVEAL_Y = 32; // px content rise distance
const REVEAL_LO = 0.3; // centredness where opacity starts
const REVEAL_HI = 0.8; // centredness where opacity completes

export default function SnapStage({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const setSnapEnabled = useSceneStore((s) => s.setSnapEnabled);
  const setSnapProgress = useSceneStore((s) => s.setSnapProgress);
  const setScrollProgress = useSceneStore((s) => s.setScrollProgress);

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const strip = stripRef.current;
    if (!root || !viewport || !strip) return;

    // ---- Per-configuration mutable state (reset on each (re)configure) -----
    let wrappers: HTMLElement[] = [];
    let inners: HTMLElement[] = [];
    let N = 0;
    let vh = window.innerHeight;

    let p = 0; // current animated progress (float section index)
    let active = 0; // committed / in-flight destination section
    let animating = false;
    let queuedTarget: number | null = null;
    let cooldownUntil = 0;
    let lastWheelTime = -Infinity;
    let from = 0;
    let to = 0;
    let startTime = 0;
    let raf = 0;

    // Touch tracking.
    let touchStartY = 0;
    let touchStartX = 0;
    let touchLastY = 0;

    const idToIndex = new Map<string, number>();

    // ---- Frame application — the SINGLE place `p` is turned into pixels -----
    const applyFrame = (pp: number) => {
      strip.style.transform = `translate3d(0, ${(-pp * vh).toFixed(2)}px, 0)`;
      for (let i = 0; i < inners.length; i++) {
        const centred = Math.max(0, 1 - Math.abs(i - pp));
        const raw = clamp01((centred - REVEAL_LO) / (REVEAL_HI - REVEAL_LO));
        const eased = easeExpoOut(raw);
        const el = inners[i];
        el.style.opacity = eased.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - eased) * REVEAL_Y).toFixed(2)}px, 0)`;
      }
      setSnapProgress(pp);
      // Keep the ambient ticker / reticle visibility (which read scrollProgress)
      // in step with the snap position.
      setScrollProgress(N > 1 ? pp / (N - 1) : 0);
    };

    const updateHash = (idx: number) => {
      const id = wrappers[idx]?.id;
      if (id && `#${id}` !== window.location.hash) {
        try {
          history.replaceState(null, '', `#${id}`);
        } catch {
          /* ignore (sandboxed history) */
        }
      }
    };

    // ---- The tween loop ---------------------------------------------------
    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const tnorm = clamp01(elapsed / DURATION);
      const eased = easeQuintInOut(tnorm);
      p = from + (to - from) * eased;
      applyFrame(p);

      if (tnorm >= 1) {
        p = to;
        applyFrame(p);
        animating = false;
        cooldownUntil = performance.now() + COOLDOWN;
        updateHash(active);
        raf = 0;
        // Honor a queued direction now that this transition has finished
        // (interruptions never cancel violently — current finishes, then next).
        if (queuedTarget !== null) {
          const q = queuedTarget;
          queuedTarget = null;
          go(q);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const startTween = (target: number) => {
      from = p;
      to = target;
      active = target;
      animating = true;
      startTime = performance.now();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    // Navigate to an absolute section index (clamped). Queues if mid-flight.
    function go(target: number) {
      const t = Math.max(0, Math.min(N - 1, target));
      if (animating) {
        queuedTarget = t;
        return;
      }
      if (t === active) return; // clamped at an end / no-op
      startTween(t);
    }

    const step = (dir: number) => go(active + dir);

    // ---- Input: WHEEL -----------------------------------------------------
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // page is locked; never let the document scroll
      const now = performance.now();
      const gap = now - lastWheelTime;
      lastWheelTime = now;
      if (animating || now < cooldownUntil) return;
      if (gap < GESTURE_GAP) return; // continuation of the same flick → ignore
      if (Math.abs(e.deltaY) < WHEEL_MIN) return;
      step(e.deltaY > 0 ? 1 : -1);
    };

    // ---- Input: KEYBOARD --------------------------------------------------
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (
        t?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT'
      ) {
        return; // never hijack typing
      }
      let handled = true;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          step(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          step(-1);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(N - 1);
          break;
        case ' ':
        case 'Spacebar': {
          // Space must still activate a focused button / link.
          if (t?.closest('a,button,[role="button"]')) return;
          step(1);
          break;
        }
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };

    // ---- Input: TOUCH (hybrid fine-pointer devices) -----------------------
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchLastY = touchStartY;
    };
    const onTouchMove = (e: TouchEvent) => {
      touchLastY = e.touches[0].clientY;
      e.preventDefault(); // block native rubber-band while locked
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? touchStartX;
      const dy = touchStartY - touchLastY; // +ve = swipe up
      const dx = touchStartX - endX;
      if (Math.abs(dy) < SWIPE_MIN || Math.abs(dy) <= Math.abs(dx)) return;
      const now = performance.now();
      if (animating || now < cooldownUntil) return;
      step(dy > 0 ? 1 : -1);
    };

    // ---- Tab-order focus recovery (never trap focus) ----------------------
    const onFocusIn = (e: FocusEvent) => {
      // Neutralize any native scroll the browser applied to bring focus on
      // screen inside the locked viewport.
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      const sec = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-sn-section]'
      );
      if (!sec) return;
      const idx = Number(sec.getAttribute('data-sn-section'));
      if (!Number.isNaN(idx) && idx !== active) go(idx);
    };

    // ---- Hash / anchor navigation -----------------------------------------
    const onHashChange = () => {
      const id = window.location.hash.replace('#', '');
      const idx = idToIndex.get(id);
      if (idx !== undefined && idx !== active) go(idx);
    };

    // ---- Style application ------------------------------------------------
    const lockedNodes: { el: HTMLElement; prop: string; prev: string }[] = [];
    const lockStyle = (el: HTMLElement, prop: string, value: string) => {
      lockedNodes.push({ el, prop, prev: el.style.getPropertyValue(prop) });
      el.style.setProperty(prop, value);
    };
    const clearStyles = () => {
      // Restore prior inline styles, then strip the dynamic ones we drive.
      for (const { el, prop, prev } of lockedNodes) {
        if (prev) el.style.setProperty(prop, prev);
        else el.style.removeProperty(prop);
      }
      lockedNodes.length = 0;
      strip.style.removeProperty('transform');
      strip.style.removeProperty('will-change');
      for (const el of inners) {
        el.style.removeProperty('opacity');
        el.style.removeProperty('transform');
        el.style.removeProperty('will-change');
      }
    };

    const applyLayout = () => {
      vh = window.innerHeight;
      viewport.style.height = `${vh}px`;
      for (const w of wrappers) w.style.height = `${vh}px`;
    };

    // ---- Configure / teardown for the current mode ------------------------
    let configured = false;

    const teardown = () => {
      if (!configured) return;
      configured = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onHashChange);
      root.removeEventListener('focusin', onFocusIn);
      clearStyles();
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!configured) return;
        applyLayout();
        applyFrame(p);
      }, 120);
    }

    const setup = () => {
      const snap = isSnapEnabled();
      setSnapEnabled(snap);
      if (!snap) {
        // Native flow: ensure nothing of ours lingers.
        teardown();
        return;
      }
      if (configured) return;
      configured = true;

      wrappers = Array.from(
        root.querySelectorAll<HTMLElement>('[data-sn-section]')
      ).sort(
        (a, b) =>
          Number(a.dataset.snSection ?? 0) - Number(b.dataset.snSection ?? 0)
      );
      inners = wrappers.map(
        (w) =>
          w.querySelector<HTMLElement>(':scope > [data-snap-reveal]') ?? w
      );
      N = wrappers.length;
      idToIndex.clear();
      wrappers.forEach((w, i) => {
        if (w.id) idToIndex.set(w.id, i);
      });

      // Lock the document so nothing behind us scrolls.
      lockStyle(document.documentElement, 'overflow', 'hidden');
      lockStyle(document.body, 'overflow', 'hidden');

      // Viewport: a single locked 100vh window that clips the strip.
      lockStyle(viewport, 'overflow', 'hidden');
      lockStyle(viewport, 'position', 'relative');
      // Strip + per-section blocks.
      strip.style.willChange = 'transform';
      for (const w of wrappers) {
        lockStyle(w, 'display', 'flex');
        lockStyle(w, 'flex-direction', 'column');
        lockStyle(w, 'justify-content', 'center');
        lockStyle(w, 'overflow', 'hidden');
      }
      for (const el of inners) el.style.willChange = 'opacity, transform';
      applyLayout();

      // Start on the section named by the URL hash, else section 0.
      const initialId = window.location.hash.replace('#', '');
      const initialIdx = idToIndex.get(initialId) ?? 0;
      p = initialIdx;
      active = initialIdx;
      applyFrame(p);

      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('hashchange', onHashChange);
      root.addEventListener('focusin', onFocusIn);
    };

    setup();
    const off = onSnapModeChange(setup);

    return () => {
      off();
      teardown();
      if (resizeTimer) clearTimeout(resizeTimer);
      setSnapEnabled(false);
    };
  }, [setSnapEnabled, setSnapProgress, setScrollProgress]);

  return (
    <div ref={rootRef}>
      <div ref={viewportRef} data-snap-viewport className="relative w-full">
        <div ref={stripRef} data-snap-strip className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
