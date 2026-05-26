/**
 * Design-system source of truth. Tailwind reads this file to extend its
 * theme so JS code and CSS classes never drift. Add new tokens here first,
 * never inline a literal in a component.
 *
 * Class conventions (Tailwind extends under the `ds` namespace):
 *   colors  → bg-ds-bg-base, text-ds-text-primary, border-ds-border-subtle,
 *             text-ds-accent-bull, etc.
 *   space   → p-ds1 .. p-ds16  (4 .. 192 px)
 *   radius  → rounded-ds-sm | -ds-md | -ds-lg | -ds-full
 *   motion  → duration-ds-fast, ease-ds-standard
 *   font    → font-ds-sans | -ds-mono
 */

export const colors = {
  bg: {
    base: '#0A0B0E',
    surface: '#13151A',
    surfaceHi: '#1A1D24',
  },
  border: {
    subtle: '#1F2228',
    strong: '#2A2E37',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A6B0',
    tertiary: '#5A6068',
  },
  accent: {
    cyan: '#4DD4FF',
    bull: '#00D982',
    bear: '#FF4D6D',
    warn: '#FFB84D',
  },
} as const;

/**
 * 4px base unit. Numeric values; the Tailwind config wraps them as px
 * strings. Keep numeric here so JS callers can do arithmetic
 * (`space[3] * 2`) without parsing.
 */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 56,
  11: 64,
  12: 80,
  13: 96,
  14: 128,
  15: 160,
  16: 192,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 10,
  full: 9999,
} as const;

export const motion = {
  /** Milliseconds. `instant` is provided so callers can disable transitions
   *  without conditionals (`duration: reduced ? 'instant' : 'base'`). */
  duration: {
    instant: 0,
    fast: 150,
    base: 300,
    slow: 600,
    cinematic: 800,
  },
  ease: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0.0, 1, 1)',
    overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

/**
 * Font stacks. Mono uses the OS UI mono so we don't ship a webfont for
 * tabular numerics; sans leads with Inter and degrades gracefully.
 */
export const type = {
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'sans-serif',
  ],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    '"SF Mono"',
    'Menlo',
    'Consolas',
    '"Liberation Mono"',
    'monospace',
  ],
} as const;

export type DesignColors = typeof colors;
export type DesignSpace = typeof space;
export type DesignRadius = typeof radius;
export type DesignMotion = typeof motion;
export type DesignType = typeof type;
