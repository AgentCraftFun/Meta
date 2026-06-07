/**
 * Travelling-globe slot table. One slot per section (index aligns with the
 * section order in app/siteNEW/page.tsx). Each slot is the GLOBE's target
 * on-screen center (viewport fractions) + scale (vs hero) + brightness /
 * opacity / blur + feather. The GlobeStageController interpolates between
 * adjacent slots by section scroll progress, then damps toward it.
 *
 * `feather` = the transparent stop (%) of the radial edge-mask, applied in
 * EVERY slot so non-hero slots are clean soft-edged discs (not rectangles):
 *   ~150 → mask falls off-screen = full-bleed (hero / dim backdrops)
 *   ~48  → tight soft disc hugging the globe (Problem / Insight / Product)
 * Lower = smaller/tighter disc, higher = larger/fuller.
 *
 * TUNED BY REASONING (headless) — nudge these against the live deploy.
 */
export type Slot = {
  cx: number; // globe center, fraction of viewport width
  cy: number; // globe center, fraction of viewport height
  scale: number;
  bright: number;
  opacity: number;
  blur: number; // px
  feather: number; // radial-mask transparent stop, %
};

export const SLOTS: Slot[] = [
  { cx: 0.68, cy: 0.5, scale: 1.0, bright: 1.0, opacity: 1.0, blur: 0, feather: 150 }, // 0 Hero — crisp, full-right
  { cx: 0.82, cy: 0.4, scale: 0.28, bright: 1.0, opacity: 1.0, blur: 0, feather: 46 }, // 1 Problem — small disc, clear upper-right (left column ≤600px holds the text)
  { cx: 0.19, cy: 0.5, scale: 0.4, bright: 1.0, opacity: 1.0, blur: 0, feather: 52 }, // 2 Insight — disc, left of the flow
  { cx: 0.62, cy: 0.5, scale: 0.3, bright: 1.0, opacity: 1.0, blur: 0, feather: 50 }, // 3 Product — disc in panel (rect-tracked when active)
  { cx: 0.5, cy: 0.45, scale: 0.95, bright: 0.5, opacity: 0.26, blur: 2, feather: 120 }, // 4 HowItWorks — dim backdrop
  { cx: 0.5, cy: 0.4, scale: 1.0, bright: 0.5, opacity: 0.24, blur: 2, feather: 130 }, // 5 Vision — dim backdrop
  { cx: 0.5, cy: 0.55, scale: 1.1, bright: 0.45, opacity: 0.22, blur: 3, feather: 140 }, // 6 CTA — dim backdrop
  { cx: 0.5, cy: 0.55, scale: 1.1, bright: 0.45, opacity: 0.0, blur: 3, feather: 140 }, // 7 Footer — faded out
];

/**
 * Globe's natural on-screen center at hero framing (matches slot 0). The
 * controller compensates for this so transform-origin can stay centered while
 * the globe still lands on each slot's target center.
 */
export const GLOBE_ORIGIN = { x: 0.68, y: 0.5 } as const;

/**
 * Globe's on-screen DIAMETER at scale 1, as a fraction of viewport height.
 * The globe is larger than the viewport at hero (it bleeds), hence > 1. Used to
 * size the globe to fit the Product panel cutout.
 */
export const GLOBE_DIAM_VH = 1.35;

/** Radial edge-feather mask string (shared by SceneCanvas default + controller). */
export function featherMask(t: number): string {
  const black = (t - 16).toFixed(1);
  return `radial-gradient(circle at ${GLOBE_ORIGIN.x * 100}% ${GLOBE_ORIGIN.y * 100}%, #000 ${black}%, transparent ${t.toFixed(1)}%)`;
}

export function lerpSlot(a: Slot, b: Slot, t: number): Slot {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return {
    cx: a.cx + (b.cx - a.cx) * k,
    cy: a.cy + (b.cy - a.cy) * k,
    scale: a.scale + (b.scale - a.scale) * k,
    bright: a.bright + (b.bright - a.bright) * k,
    opacity: a.opacity + (b.opacity - a.opacity) * k,
    blur: a.blur + (b.blur - a.blur) * k,
    feather: a.feather + (b.feather - a.feather) * k,
  };
}
