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
// PER-SECTION PLACEMENTS — sections 0–4 are the EXACT cx/cy/scale the user
// dialled in with the ?place tool (do not "tidy" these numbers). The globe
// dwells on each slot and slides smoothly between them (see GlobeStageController).
// Sections 5–7 stay dim "console" backdrops. No flat-edge cropping is possible:
// the globe is always rendered fully inside its buffer, so only the screen edges
// crop it (the intended full-bleed). reference @ scale 1.0 → globe ≈ 0.93 vh.
const DIM_SCALE = 1.25; // dim backdrops (5–7) — big, centred, faint

export const SLOTS: Slot[] = [
  // §0–§4 are the EXACT cx/cy/scale hand-tuned against the live deploy this
  // session — do not round or "improve". All five are full-visibility travel
  // slots (bright 1, opacity 1, no blur).
  { cx: 0.670, cy: 0.530, scale: 1.480, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 0 Hero
  { cx: 0.740, cy: 0.470, scale: 0.940, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 1 Problem
  { cx: 0.130, cy: 0.480, scale: 1.090, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 2 Insight
  { cx: 0.650, cy: 0.490, scale: 0.410, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 3 Product
  { cx: 0.510, cy: 0.500, scale: 1.250, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 4 HowItWorks
  // §5 Vision — the globe DOCKS onto the "Earth" product card (tuned via ?place:
  // cx 0.23 / cy 0.52 / scale 0.44). Full visibility; it travels here from §4.
  { cx: 0.230, cy: 0.520, scale: 0.440, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 5 Vision (Earth card)
  // §6 CTA — back to a big centred planet behind the copy (preserves the prior
  // clamped look now that §5 is a real travel slot).
  { cx: 0.500, cy: 0.500, scale: 1.250, bright: 1.0, opacity: 1.0, blur: 0, feather: 0 }, // 6 CTA (centred)
  { cx: 0.5, cy: 0.5, scale: DIM_SCALE, bright: 0.5, opacity: 0.0, blur: 3, feather: 0 }, // 7 Footer (clamped to §6)
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

/**
 * CENTRE-LOCK — the design "stage". cx/cy positions only line up with the
 * centred, max-width content at the viewport they were tuned at; on other
 * monitors they drift. globeTransform can clamp the globe's coordinate frame to
 * a fixed stage CENTRED in the viewport, so wider/taller screens keep the SAME
 * relationship to the content (and the globe can't balloon).
 *
 * The lock is OPT-IN per page via setStageLock(), defaulting to OFF (infinite),
 * so /siteNEW and the rest of the app keep the original cx*vw / cy*vh placement
 * EXACTLY. /siteMARS turns it on at its measured viewport (1512×752) on mount
 * and resets it on unmount, so only Mars is locked — see components/sitemars.
 */
let _stageLockW = Infinity;
let _stageLockH = Infinity;

/** Set (or, with no args, clear) the centre-lock stage. Module-level so EVERY
 *  globeTransform consumer — the travelling globe, the Vision moon + orb-bot,
 *  the placer — locks in lock-step. */
export function setStageLock(w: number = Infinity, h: number = Infinity): void {
  _stageLockW = w;
  _stageLockH = h;
}

/**
 * THE shared globe-positioning math — the SINGLE source of truth for turning a
 * slot's (cx, cy, scale) into a CSS transform. Called by BOTH the runtime
 * controller (GlobeStageController) AND the live tuning overlay (GlobePlacer),
 * so "what you tune is exactly what ships".
 *
 * CONTRACT
 *   cx, cy      : where the globe's visual CENTER must land, as a fraction of
 *                 the centre-locked stage (= the viewport when the lock is off).
 *   scale       : size multiplier vs the un-scaled globe (locked to the stage
 *                 height so the globe stays a constant on-screen size above it).
 *   vw, vh      : current viewport size (px).
 *   baseW, baseH: the #globe-transform element's UN-scaled layout size. The
 *                 globe is rendered dead-centre inside it, so the element's
 *                 centre IS the globe's centre.
 *
 * TRANSFORM-ORIGIN: **center center** (set in CSS on #globe-transform).
 */
export function globeTransform(
  cx: number,
  cy: number,
  scale: number,
  vw: number,
  vh: number,
  baseW: number,
  baseH: number
): string {
  // Centre-locked stage: clamp the coordinate frame, then centre it.
  const stageW = Math.min(vw, _stageLockW);
  const stageH = Math.min(vh, _stageLockH);
  const offX = (vw - stageW) / 2;
  const offY = (vh - stageH) / 2;
  // Lock the globe's on-screen size to the stage height (no-op when vh ≤ lock).
  const lockedScale = scale * (stageH / vh);
  const tx = offX + cx * stageW - baseW / 2;
  const ty = offY + cy * stageH - baseH / 2;
  return `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${lockedScale.toFixed(4)})`;
}

/**
 * The on-screen pixel CENTER the above transform yields, in the centre-locked
 * stage frame. (The `scale` argument is intentionally unused — the centre is
 * scale-independent under centre-origin scaling.)
 */
export function globeCenterPx(
  cx: number,
  vw: number,
  _baseW: number,
  _scale: number
): number {
  const stageW = Math.min(vw, _stageLockW);
  const offX = (vw - stageW) / 2;
  return offX + cx * stageW;
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

/* ================================================================== *
 * SHARED TRAVEL MODEL — ONE source of truth for "where the globe is at
 * a given scroll", imported by BOTH the runtime controller AND the
 * GlobePlacer overlay so what you tune is exactly what ships.
 * ================================================================== */

/** Highest section index the globe travels to. §5 docks the globe onto the
 *  Vision "Earth" card; §6 recentres it behind the CTA; §7 clamps to §6. */
export const LAST_SECTION = 6;

/**
 * Visible build marker — bump on every globe change so we can confirm at a
 * glance which build is actually live (printed to console on load + shown in the
 * GLOBE PLACER panel). If you don't see this exact tag, you're on a stale build.
 */
export const GLOBE_BUILD_TAG = 'globe-build-11 · SMOOTH TRAVEL + ROTATION';

// Long horizontal traverses get a shallow orbital arc (subtle, vanishes at the
// endpoints). Only applied when |Δcx| between two slots exceeds ARC_DCX.
const ARC_DCX = 0.4;
const ARC_AMOUNT = 0.06;

const flerp = (a: number, b: number, e: number): number => a + (b - a) * e;

/** Sorted list of section elements (index === data-sn-section). */
export function getSections(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-sn-section]')).sort(
    (a, b) => Number(a.dataset.snSection) - Number(b.dataset.snSection)
  );
}

/** The ONE scroll source: Lenis's smoothed scroll if present, else scrollY. */
export function getScroll(): number {
  const lenis = (window as unknown as { __lenis?: { scroll: number } }).__lenis;
  return lenis ? lenis.scroll : window.scrollY;
}

/**
 * Absolute-document scroll positions at which t === section index.
 *   anchor[0] = 0 (hero top); anchor[i>0] = the scroll at which section i is
 *   CENTRED in the viewport. Computed once on mount/resize and cached — never
 *   per frame — so ticker reflows can't shift them mid-scroll.
 */
export function buildAnchors(sections: HTMLElement[], vh: number, scroll: number): number[] {
  const lastIdx = Math.min(LAST_SECTION, sections.length - 1);
  const out: number[] = [];
  for (let i = 0; i <= lastIdx; i++) {
    if (i === 0) {
      out[i] = 0;
      continue;
    }
    const r = sections[i].getBoundingClientRect();
    out[i] = r.top + scroll + r.height / 2 - vh / 2;
  }
  return out;
}

/**
 * The section the viewport is currently "on": the last section whose top has
 * reached/passed the viewport centre, clamped to the travelling range. ONE
 * definition, used by BOTH the controller and the placer, so the live page and
 * the tuning overlay can never disagree about which slot to show.
 */
export function activeSection(): number {
  const center = window.innerHeight / 2;
  const sections = getSections();
  let a = 0;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].getBoundingClientRect().top <= center + 0.5) a = i;
  }
  return Math.min(a, LAST_SECTION);
}

/** Continuous float section index for a scroll position. Clamped to [0,last]. */
export function scrollToT(scroll: number, anchors: number[]): number {
  const lastIdx = anchors.length - 1;
  if (lastIdx <= 0 || scroll <= anchors[0]) return 0;
  for (let i = 0; i < lastIdx; i++) {
    if (scroll < anchors[i + 1]) {
      const span = anchors[i + 1] - anchors[i];
      const f = span > 0 ? (scroll - anchors[i]) / span : 0;
      return i + (f < 0 ? 0 : f > 1 ? 1 : f);
    }
  }
  return lastIdx;
}

/**
 * Dwell-plateau ease. Flat (=0) while close to a section centre and flat (=1)
 * while close to the next, with a smoothstep transition through the middle
 * band. This is what makes the globe SIT exactly on a slot while its section
 * is centred (so pausing never drifts) yet glide smoothly between slots.
 */
function dwellEase(f: number): number {
  const A = 0.35;
  const B = 0.65;
  if (f <= A) return 0;
  if (f >= B) return 1;
  const x = (f - A) / (B - A);
  return x * x * (3 - 2 * x);
}

/**
 * Core slot interpolation between adjacent slots, given an ALREADY-eased segment
 * fraction `e` (0→1). cx/cy linear, scale in LOG space (perceptually even
 * shrink/grow), shallow arc on long horizontal traverses (endpoints exact).
 * Shared by both the free-scroll (dwell) and snap (smooth) readers below so the
 * spatial math is identical — only the easing of `e` differs.
 */
function interpSlot(a: Slot, b: Slot, e: number): Slot {
  const cx = flerp(a.cx, b.cx, e);
  let cy = flerp(a.cy, b.cy, e);
  const scale = Math.exp(flerp(Math.log(a.scale), Math.log(b.scale), e));
  if (Math.abs(b.cx - a.cx) > ARC_DCX) {
    cy += -ARC_AMOUNT * Math.sin(Math.PI * e);
  }
  return {
    cx,
    cy,
    scale,
    bright: flerp(a.bright, b.bright, e),
    opacity: flerp(a.opacity, b.opacity, e),
    blur: flerp(a.blur, b.blur, e),
    feather: flerp(a.feather, b.feather, e),
  };
}

/**
 * THE shared interpolation: continuous t → an interpolated Slot.
 *   • dwell-eased fractional part (rest-on-slot + smooth handoff)
 *   • cx/cy linear, scale in LOG space (perceptually even shrink/grow)
 *   • shallow arc on long horizontal traverses (endpoints exact)
 * The controller damps toward this; the placer applies it directly. Same code
 * ⇒ the overlay preview and the live travel are pixel-identical.
 */
export function slotAt(t: number, slots: Slot[]): Slot {
  const lastIdx = Math.min(LAST_SECTION, slots.length - 1);
  const lo = Math.max(0, Math.min(Math.floor(t), lastIdx));
  const hi = Math.min(lo + 1, lastIdx);
  return interpSlot(slots[lo], slots[hi], dwellEase(t - lo));
}

/**
 * SNAP variant: continuous t → interpolated Slot using the RAW (linear) segment
 * fraction — NO dwell plateau. In section-snap mode `t` is already the cinematic
 * quint-eased progress `p`, so the globe's temporal curve must be a direct
 * function of `t` (no second easing) to stay in PERFECT lock-step with the
 * section pan (which is also linear in `p`). The dwell plateau is only correct
 * for free scroll (where it rests the globe on a slot while a section is
 * centred); applying it here would compress the globe's travel into the middle
 * of the transition and make it whip. Same log-scale + long-traverse arc as
 * slotAt — only the easing of the fraction differs. At integer t this returns
 * the exact tuned slot, so the globe lands precisely on every slot.
 */
export function slotAtSmooth(t: number, slots: Slot[]): Slot {
  const lastIdx = Math.min(LAST_SECTION, slots.length - 1);
  const lo = Math.max(0, Math.min(Math.floor(t), lastIdx));
  const hi = Math.min(lo + 1, lastIdx);
  const f = t - lo;
  const e = f < 0 ? 0 : f > 1 ? 1 : f;
  return interpSlot(slots[lo], slots[hi], e);
}
