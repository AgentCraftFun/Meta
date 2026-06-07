/**
 * siteNEW MOTION SYSTEM — single source of truth.
 *
 * The ONLY place colors / easings / springs / timings / z-index live for the
 * /siteNEW experience. Every sitenew component imports from here. No magic
 * numbers in components.
 *
 * Easings are exported in two shapes:
 *   - `*Css`   → cubic-bezier() string for CSS transitions / GSAP / keyframes
 *   - `*`      → [x1,y1,x2,y2] tuple for framer-motion `ease`
 */

import type { Transition } from 'framer-motion';

/* ------------------------------------------------------------------ *
 * EASING
 * ------------------------------------------------------------------ */

export const easeCss = {
  /** reveals */
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** UI / hover */
  powerOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** camera + big sweeps */
  quartIO: 'cubic-bezier(0.76, 0, 0.24, 1)',
  /** ambient loops ONLY (rotation, grain, marquee, radar) */
  linear: 'linear',
} as const;

export const ease = {
  expoOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  powerOut: [0.22, 1, 0.36, 1] as [number, number, number, number],
  quartIO: [0.76, 0, 0.24, 1] as [number, number, number, number],
} as const;

/* ------------------------------------------------------------------ *
 * SPRINGS (framer-motion)
 * ------------------------------------------------------------------ */

export const spring = {
  /** press / buttons */
  snappy: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 } satisfies Transition,
  /** cards / reveals */
  soft: { type: 'spring', stiffness: 120, damping: 18, mass: 1 } satisfies Transition,
  /** cursor-follow / magnetic */
  magnetic: { type: 'spring', stiffness: 150, damping: 15, mass: 0.5 } satisfies Transition,
} as const;

/** R3F camera lerp — maath.damp lambda. ~0.06/frame @60fps. */
export const CAMERA_LAMBDA = 4;
/** Reticle pointer-follow lerp lambda (Phase 6). */
export const RETICLE_LAMBDA = 6;

/* ------------------------------------------------------------------ *
 * TRAVELLING GLOBE
 * ------------------------------------------------------------------ */

/** Globe-travel damp lambda — buttery, never snaps (~0.07/frame @60fps). */
export const GLOBE_DAMP_LAMBDA = 4.5;

/** Alternative spring form for the globe travel (if used instead of damp). */
export const globeSpring = {
  type: 'spring',
  stiffness: 90,
  damping: 26,
  mass: 1,
} as const;

/* ------------------------------------------------------------------ *
 * TIMING (seconds) + STAGGER
 * ------------------------------------------------------------------ */

export const dur = {
  micro: 0.12,
  fast: 0.2,
  base: 0.4,
  reveal: 0.6,
  slow: 0.9,
  cine: 1.2,
} as const;

export const stagger = {
  groups: 0.08,
  words: 0.04,
} as const;

/* ------------------------------------------------------------------ *
 * PALETTE — keep the DNA, add hierarchy
 * ------------------------------------------------------------------ */

export const color = {
  bg: '#05080F',
  panel: '#0B1220',
  panelHi: '#111A2E',
  border: '#1E293B',
  /** SYSTEM / baseline — the default accent */
  cyan: '#22D3EE',
  /** NARRATIVE INTENSITY scale — use sparingly, meaningfully */
  amber: '#FBBF24',
  red: '#EF4444',
  text: '#FFFFFF',
  textBody: '#CBD5E1', // slate-300
  textDim: '#94A3B8', // slate-400
  textMuted: '#64748B', // slate-500
} as const;

/** rgba helper for the few places that need inline alpha glows. */
export function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------------ *
 * Z-DEPTH MAP
 * ------------------------------------------------------------------ */

export const z = {
  earth: 0, // fixed WebGL canvas
  content: 10,
  hud: 20, // HUD / ticker
  grade: 30, // grade overlay (pointer-events-none)
  reticle: 40,
  boot: 50,
  skip: 60, // skip-link
} as const;

/* ------------------------------------------------------------------ *
 * REVEAL + HOVER DEFAULTS
 * ------------------------------------------------------------------ */

/** Default scroll reveal: y:24→0, opacity 0→1, 0.6s expoOut, once, -15% margin. */
export const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-15%' } as const,
  transition: { duration: dur.reveal, ease: ease.expoOut },
} as const;

/** Reduced-motion reveal: opacity only, 0.3s, NO transform. */
export const revealReduced = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-15%' } as const,
  transition: { duration: 0.3, ease: ease.expoOut },
} as const;

/** Default hover lift: scale 1.02, y -2, 0.2s snappy. */
export const hoverLift = {
  whileHover: { scale: 1.02, y: -2 },
  transition: spring.snappy,
} as const;
