/**
 * Cubic-bézier easing solver for the section-snap experience. Pure, framework
 * free — used by the snap p-tween (the cinematic quint) and the per-section
 * content reveal (expoOut). Mirrors the CSS `cubic-bezier(x1,y1,x2,y2)` curve so
 * the JS-driven motion matches the design system's easing tokens exactly.
 *
 * Implementation: the X(t) Bézier polynomial is inverted for t given x (Newton
 * with a bisection fallback), then Y(t) is evaluated. Standard WebKit approach.
 */

const NEWTON_ITERATIONS = 5;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 1e-7;
const SUBDIVISION_MAX_ITERATIONS = 12;

const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
const B = (a1: number, a2: number) => 3 * a2 - 6 * a1;
const C = (a1: number) => 3 * a1;

/** Bézier component at parameter t for control points (a1, a2) with ends 0/1. */
function calc(t: number, a1: number, a2: number): number {
  return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
}

/** d/dt of the above — the slope, used by Newton's method. */
function slope(t: number, a1: number, a2: number): number {
  return 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
}

function bisect(x: number, x1: number, x2: number, a1: number, a2: number): number {
  let lo = x1;
  let hi = x2;
  let t = x;
  for (let i = 0; i < SUBDIVISION_MAX_ITERATIONS; i++) {
    const xEst = calc(t, a1, a2) - x;
    if (Math.abs(xEst) < SUBDIVISION_PRECISION) break;
    if (xEst > 0) hi = t;
    else lo = t;
    t = (hi + lo) / 2;
  }
  return t;
}

/**
 * Returns an easing function `(t:0→1) → eased:0→1` for the given control points.
 * Linear is returned unchanged when the curve is the identity diagonal.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (t: number) => number {
  if (x1 === y1 && x2 === y2) return (t) => t; // linear identity

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    // Invert X(guess) === t to find the curve parameter.
    let guess = t;
    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
      const currentSlope = slope(guess, x1, x2);
      if (currentSlope < NEWTON_MIN_SLOPE) break;
      const currentX = calc(guess, x1, x2) - t;
      guess -= currentX / currentSlope;
    }
    if (slope(guess, x1, x2) < NEWTON_MIN_SLOPE) {
      guess = bisect(t, 0, 1, x1, x2);
    }
    return calc(guess, y1, y2);
  };
}

/** Cinematic ease-in-out-quint — the snap section→section transition curve. */
export const easeQuintInOut = cubicBezier(0.83, 0, 0.17, 1);

/** Expo-out — the per-section content reveal curve (matches easeCss.expoOut). */
export const easeExpoOut = cubicBezier(0.16, 1, 0.3, 1);

/** Clamp helper. */
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
