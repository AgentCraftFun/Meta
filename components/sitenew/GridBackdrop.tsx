'use client';

type Props = {
  /** Spacing between grid lines in px */
  step?: number;
  /** Hex with alpha, e.g. 'rgba(34,211,238,0.05)' */
  color?: string;
  /** Add a soft radial mask so the grid fades at the edges */
  fade?: boolean;
  className?: string;
};

/**
 * Subtle CSS-only orbital grid. Pure decoration — sits behind section
 * content, never grabs focus, but adds depth and a tactical feel.
 */
export default function GridBackdrop({
  step = 64,
  color = 'rgba(34, 211, 238, 0.06)',
  fade = true,
  className = '',
}: Props) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${step}px ${step}px`,
        maskImage: fade
          ? 'radial-gradient(ellipse at center, black 50%, transparent 100%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'radial-gradient(ellipse at center, black 50%, transparent 100%)'
          : undefined,
      }}
    />
  );
}
