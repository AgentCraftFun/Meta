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

// The globe is rendered as a FULL sphere centred in the canvas (camera pulled
// back), at ~0.93 of viewport height at scale 1. cx/cy place the globe centre;
// scale sizes it.
//
// ANTI-GLITCH (important): every "story" section uses the SAME large scale, so
// the globe NEVER resizes as you scroll — it only travels (cx/cy) and rotates.
// Previously each slot had a different (smaller) resting scale, so after the
// Lenis smooth-scroll settled the globe damped DOWN to a smaller size ~1s after
// you landed — that late shrink read as a "glitch". Keeping one scale removes
// the size delta entirely; the dim "console" backdrops keep the same size too
// and only drop brightness/opacity. Scale 1.25 stays crisp (< dpr cap 2.0, so
// the canvas is still super-sampled when CSS-scaled).
const STORY_SCALE = 1.25;

export const SLOTS: Slot[] = [
  { cx: 0.64, cy: 0.5, scale: STORY_SCALE, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 0 Hero — big globe, right-of-centre, bleeds off the edges
  { cx: 0.76, cy: 0.5, scale: STORY_SCALE, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 1 Problem — same size, hugs the RIGHT (clears the left text)
  { cx: 0.12, cy: 0.5, scale: STORY_SCALE, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 2 Insight — same size, hugs the LEFT (clears the right content)
  { cx: 0.66, cy: 0.5, scale: STORY_SCALE, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 3 Product — same size, right, behind the product-mock cutout
  { cx: 0.5, cy: 0.5, scale: STORY_SCALE, bright: 0.55, opacity: 0.3, blur: 2, feather: 0 }, // 4 HowItWorks — same size, centred, dim backdrop
  { cx: 0.5, cy: 0.5, scale: STORY_SCALE, bright: 0.55, opacity: 0.28, blur: 2, feather: 0 }, // 5 Vision — dim backdrop
  { cx: 0.5, cy: 0.5, scale: STORY_SCALE, bright: 0.5, opacity: 0.26, blur: 3, feather: 0 }, // 6 CTA — dim backdrop
  { cx: 0.5, cy: 0.5, scale: STORY_SCALE, bright: 0.5, opacity: 0.0, blur: 3, feather: 0 }, // 7 Footer — faded out
];

/**
 * Globe's natural on-screen centre at scale-1 framing. The globe is now centred
 * in the canvas (camera looks at origin), so this is dead-centre; the controller
 * translates from here to each slot's target centre.
 */
export const GLOBE_ORIGIN = { x: 0.5, y: 0.5 } as const;

/**
 * Globe's on-screen DIAMETER at scale 1, as a fraction of viewport height
 * (~0.85 with the pulled-back camera). Used to fit the globe into the Product
 * panel cutout.
 */
export const GLOBE_DIAM_VH = 0.97;

/**
 * Clip-path circle centered on the globe (GLOBE_ORIGIN). `r` is the radius %.
 * ≥100 → effectively no clip (full-bleed); ~55 → a circle hugging the globe.
 * Hardware-accelerated and reliable with transform/filter (unlike mask-image).
 */
export function clipCircle(r: number): string {
  return `circle(${r.toFixed(1)}% at ${GLOBE_ORIGIN.x * 100}% ${GLOBE_ORIGIN.y * 100}%)`;
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
