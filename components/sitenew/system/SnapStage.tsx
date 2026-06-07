'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { clamp01, easeExpoOut, easeSnap } from './easing';
import { isSnapEnabled, onSnapModeChange } from './snapMode';
import { useSceneStore } from './useSceneStore';

/**
 * SECTION-LOCKED SCROLL SNAP (desktop / fine-pointer only).
 *
 * The page does NOT free-scroll. It locks to one section at a time; a single
 * wheel / key / swipe gesture triggers ONE buttery transition to the adjacent
 * section, then locks there. Everything is driven from ONE animated progress
 * value `p` (tweened current→target over ~1.0s on easeSnap), so nothing desyncs.
 *
 * RESPONSIVENESS — LEADING-EDGE FIRE: the FIRST wheel/key/swipe event (when not
 * already animating) starts the transition immediately — no accumulation window,
 * no debounce before starting. The lock comes AFTER: once moving, all further
 * navigation input is ignored until the transition completes + a short cooldown.
 * That is what makes it feel instant yet still "one flick = one section".
 *
 * DEPTH — everything reads from `p` at a different PLANE so each transition feels
 * like flying through 3D space, not sliding flat sheets:
 *   • GLOBE (far): the GlobeStageController reads `p` → slotAtSmooth; the slowest,
 *     most distant element.
 *   • SECTION STRIP: one translate3d(0,-p·100vh,0) GPU pan (the camera dolly).
 *   • FOCAL CONTENT BLOCK (1.0×): per section it recedes/advances in Z — incoming
 *     rises from scale 0.96 + opacity 0; outgoing falls back to scale 0.92 + 0.
 *   • NEAR ACCENTS ([data-snap-depth] > 1, eyebrows / corner brackets): parallax
 *     FASTER than content so they rush past the camera — the strongest depth cue.
 *   • FAR GRID ([data-snap-grid]): drifts slower than content (back plane).
 * All layers track `p` exactly off ONE rAF tween — no springs, so they can't
 * desync. transform + opacity only; will-change is toggled on only while moving.
 *
 * GUARDRAILS: disabled under prefers-reduced-motion and on mobile / coarse
 * pointer / <768px (native scroll + the existing static/scroll globe take over;
 * reduced-motion therefore gets plain native reveals, no parallax/scale/recede).
 * Keyboard a11y (arrows / PageUp·Down / Space / Home / End — leading-edge too),
 * tab-order focus recovery, hash sync, and end-clamping are all handled.
 *
 * In non-snap mode this component is an inert pass-through wrapper: the viewport
 * / strip render as plain blocks and the children stack and scroll natively.
 */

const DURATION = 1.0; // seconds — the cinematic transition length
const COOLDOWN = 120; // ms lock AFTER a transition before the next gesture
const WHEEL_MIN = 10; // px — distinguish a deliberate gesture from micro-scroll
const SWIPE_MIN = 40; // px — min touch travel to count as a swipe

const REVEAL_Y = 28; // px content rise distance during reveal
const REVEAL_LO = 0.3; // centredness where opacity starts
const REVEAL_HI = 0.8; // centredness where opacity completes
const SCALE_IN = 0.04; // incoming section starts at scale 1 - this (0.96)
const SCALE_OUT = 0.08; // outgoing section recedes to scale 1 - this (0.92)

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
    // Near-plane parallax accents (eyebrows, corner brackets, …), paired with
    // the index of the section they belong to and their depth multiplier.
    let accents: { el: HTMLElement; section: number; depth: number }[] = [];
    let gridLayers: HTMLElement[] = []; // far-plane backdrops ([data-snap-grid])
    let N = 0;
    let vh = window.innerHeight;

    let p = 0; // current animated progress (float section index)
    let active = 0; // committed / in-flight destination section
    let animating = false;
    let queuedTarget: number | null = null;
    let cooldownUntil = 0;
    let from = 0;
    let to = 0;
    let startTime = 0;
    let raf = 0;

    // Touch tracking.
    let touchStartY = 0;
    let touchStartX = 0;
    let touchLastY = 0;

    const idToIndex = new Map<string, number>();

    // Grid back-plane drift per section travelled (slow distant parallax).
    const GRID_DRIFT = 7; // px

    // ---- Frame application — the SINGLE place `p` is turned into pixels -----
    const applyFrame = (pp: number) => {
      // CAMERA DOLLY: one pan transform on the whole strip.
      strip.style.transform = `translate3d(0, ${(-pp * vh).toFixed(2)}px, 0)`;

      // FOCAL PLANE: each section's content block reveals + recedes/advances in
      // Z. `d` = signed distance from centre (>0 below/incoming, <0 above/leaving).
      for (let i = 0; i < inners.length; i++) {
        const d = i - pp;
        const centred = Math.max(0, 1 - Math.abs(d));
        const e = easeExpoOut(clamp01((centred - REVEAL_LO) / (REVEAL_HI - REVEAL_LO)));
        // Incoming rises toward the camera from 0.96; outgoing falls back to 0.92.
        const away = d >= 0 ? SCALE_IN : SCALE_OUT;
        const scale = 1 - (1 - e) * away;
        // Small advance/recede along the travel direction (composes with the pan).
        const ty = (1 - e) * REVEAL_Y * (d >= 0 ? 1 : -1);
        const el = inners[i];
        el.style.opacity = e.toFixed(3);
        el.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }

      // NEAR PLANE: accents parallax FASTER than their section (rush past camera).
      // FAR-ish elements (depth < 1) would lag; we only tag near accents here.
      for (let i = 0; i < accents.length; i++) {
        const a = accents[i];
        const extra = (a.section - pp) * vh * (a.depth - 1);
        a.el.style.transform = `translate3d(0, ${extra.toFixed(2)}px, 0)`;
      }

      // FAR PLANE: the grid backdrop drifts slowly (distant, lags the content).
      for (let i = 0; i < gridLayers.length; i++) {
        gridLayers[i].style.transform = `translate3d(0, ${(-pp * GRID_DRIFT).toFixed(2)}px, 0)`;
      }

      setSnapProgress(pp);
      // Keep the ambient ticker / reticle visibility (which read scrollProgress)
      // in step with the snap position.
      setScrollProgress(N > 1 ? pp / (N - 1) : 0);
    };

    // will-change is ON only while a transition is running (perf: avoid many
    // permanent compositor layers).
    const setWillChange = (on: boolean) => {
      const v = on ? 'transform' : '';
      strip.style.willChange = on ? 'transform' : '';
      for (const el of inners) el.style.willChange = on ? 'transform, opacity' : '';
      for (const a of accents) a.el.style.willChange = v;
      for (const el of gridLayers) el.style.willChange = v;
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
      const eased = easeSnap(tnorm);
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
        // If nothing else started, we are idle — drop the compositor hints.
        if (!animating) setWillChange(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const startTween = (target: number) => {
      // The grid backdrop ([data-snap-grid]) is mounted by SceneCanvas after
      // hydration, so it may not have existed at setup — pick it up lazily.
      if (gridLayers.length === 0) {
        gridLayers = Array.from(
          document.querySelectorAll<HTMLElement>('[data-snap-grid]')
        );
      }
      from = p;
      to = target;
      active = target;
      animating = true;
      setWillChange(true);
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

    // ---- Input: WHEEL (LEADING-EDGE) --------------------------------------
    // The FIRST event fires the move IMMEDIATELY — no accumulation/debounce
    // before starting. The lock comes after: while animating, and for a short
    // cooldown after, further wheel events are ignored. The cooldown self-extends
    // only while a fling's inertial TAIL keeps streaming, so one long flick can't
    // double-fire — yet a fresh, deliberate flick (a natural >cooldown gap later)
    // still fires on its leading edge with zero added latency.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // page is locked; never let the document scroll
      if (animating) return;
      const now = performance.now();
      if (now < cooldownUntil) {
        cooldownUntil = now + COOLDOWN; // keep the lock warm through the tail
        return;
      }
      if (Math.abs(e.deltaY) < WHEEL_MIN) return; // accidental micro-scroll
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
      for (const a of accents) {
        a.el.style.removeProperty('transform');
        a.el.style.removeProperty('will-change');
      }
      for (const el of gridLayers) {
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

      // Collect the parallax planes. Near accents ([data-snap-depth]) belong to
      // whichever section contains them; the grid backdrop is a far plane.
      accents = [];
      wrappers.forEach((w, i) => {
        w.querySelectorAll<HTMLElement>('[data-snap-depth]').forEach((el) => {
          const depth = Number(el.dataset.snapDepth);
          if (!Number.isNaN(depth) && depth !== 1) {
            accents.push({ el, section: i, depth });
          }
        });
      });
      gridLayers = Array.from(
        document.querySelectorAll<HTMLElement>('[data-snap-grid]')
      );

      // Lock the document so nothing behind us scrolls.
      lockStyle(document.documentElement, 'overflow', 'hidden');
      lockStyle(document.body, 'overflow', 'hidden');

      // Viewport: a single locked 100vh window that clips the strip.
      lockStyle(viewport, 'overflow', 'hidden');
      lockStyle(viewport, 'position', 'relative');
      // Strip + per-section blocks. (will-change is toggled per-transition.)
      for (const w of wrappers) {
        lockStyle(w, 'display', 'flex');
        lockStyle(w, 'flex-direction', 'column');
        lockStyle(w, 'justify-content', 'center');
        lockStyle(w, 'overflow', 'hidden');
      }
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
