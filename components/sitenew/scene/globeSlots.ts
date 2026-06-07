/**
 * Travelling-globe slot table. One slot per section (index aligns with the
 * section order in app/siteNEW/page.tsx). Each slot is the GLOBE's target
 * on-screen center (viewport fractions) + scale (vs hero) + brightness /
 * opacity / blur. The GlobeStageController interpolates between adjacent slots
 * by section scroll progress, then damps toward it (removes snapping).
 *
 * STARTING VALUES — tune against the reference screenshots.
 */
export type Slot = {
  cx: number; // globe center, fraction of viewport width
  cy: number; // globe center, fraction of viewport height
  scale: number;
  bright: number;
  opacity: number;
  blur: number; // px
};

export const SLOTS: Slot[] = [
  { cx: 0.68, cy: 0.5, scale: 1.0, bright: 1.0, opacity: 1.0, blur: 0 }, // 0 Hero — crisp, foreground
  { cx: 0.74, cy: 0.4, scale: 0.42, bright: 1.0, opacity: 1.0, blur: 0 }, // 1 Problem — disc, right
  { cx: 0.24, cy: 0.48, scale: 0.42, bright: 1.0, opacity: 1.0, blur: 0 }, // 2 Insight — disc, left
  { cx: 0.62, cy: 0.5, scale: 0.3, bright: 1.0, opacity: 1.0, blur: 0 }, // 3 Product — disc in panel
  { cx: 0.5, cy: 0.45, scale: 0.95, bright: 0.5, opacity: 0.26, blur: 2 }, // 4 HowItWorks — dim backdrop
  { cx: 0.5, cy: 0.4, scale: 1.0, bright: 0.5, opacity: 0.24, blur: 2 }, // 5 Vision — dim backdrop
  { cx: 0.5, cy: 0.55, scale: 1.1, bright: 0.45, opacity: 0.22, blur: 3 }, // 6 CTA — dim backdrop
  { cx: 0.5, cy: 0.55, scale: 1.1, bright: 0.45, opacity: 0.0, blur: 3 }, // 7 Footer — faded out
];

/**
 * Globe's natural on-screen center at hero framing (matches slot 0). The
 * controller compensates for this so transform-origin can stay centered while
 * the globe still lands on each slot's target center.
 */
export const GLOBE_ORIGIN = { x: 0.68, y: 0.5 } as const;

export function lerpSlot(a: Slot, b: Slot, t: number): Slot {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return {
    cx: a.cx + (b.cx - a.cx) * k,
    cy: a.cy + (b.cy - a.cy) * k,
    scale: a.scale + (b.scale - a.scale) * k,
    bright: a.bright + (b.bright - a.bright) * k,
    opacity: a.opacity + (b.opacity - a.opacity) * k,
    blur: a.blur + (b.blur - a.blur) * k,
  };
}
