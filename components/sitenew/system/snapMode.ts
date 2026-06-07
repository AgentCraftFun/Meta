'use client';

/**
 * SINGLE source of truth for "is section-snap active right now?". Every snap
 * collaborator (SnapStage, SmoothScroll, ScrollDirector, GlobeStageController)
 * reads this so they can never disagree about the mode.
 *
 * Snap is enabled ONLY on a desktop-class pointer experience:
 *   • NOT prefers-reduced-motion  (a11y opt-out → native scroll fallback)
 *   • a FINE pointer              (mouse/trackpad — never coarse/touch)
 *   • viewport ≥ 768px            (small screens get normal vertical scroll)
 *
 * Anything else falls back to normal native scrolling with the existing
 * static / scroll-driven globe — no scroll hijacking.
 */

const Q_REDUCED = '(prefers-reduced-motion: reduce)';
const Q_FINE = '(pointer: fine)';
const Q_WIDE = '(min-width: 768px)';

export function isSnapEnabled(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const reduced = window.matchMedia(Q_REDUCED).matches;
  const fine = window.matchMedia(Q_FINE).matches;
  const wide = window.matchMedia(Q_WIDE).matches;
  return !reduced && fine && wide;
}

/**
 * Subscribe to any change that could flip snap-eligibility (RM toggle, pointer
 * type change, crossing the 768px breakpoint). Returns an unsubscribe fn.
 */
export function onSnapModeChange(cb: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mqls = [Q_REDUCED, Q_FINE, Q_WIDE].map((q) => window.matchMedia(q));
  mqls.forEach((m) => m.addEventListener('change', cb));
  return () => mqls.forEach((m) => m.removeEventListener('change', cb));
}
