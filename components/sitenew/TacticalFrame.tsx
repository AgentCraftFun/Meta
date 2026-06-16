'use client';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Hex / Tailwind-arbitrary colour value, e.g. '#22d3ee' */
  color?: string;
  size?: number;
  thickness?: number;
};

/**
 * Wraps content in a tactical-style frame: thin corner brackets in each
 * corner of the bounding box, with the content rendering normally inside.
 * Drops a faint inner stroke for a "scoped" feel.
 */
export default function TacticalFrame({
  children,
  className = '',
  color = 'rgb(var(--accent-400))',
  size = 14,
  thickness = 1.25,
}: Props) {
  const stroke = `${thickness}px solid ${color}`;
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[1px] -top-[1px] z-10"
        style={{ width: size, height: size, borderTop: stroke, borderLeft: stroke }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[1px] -top-[1px] z-10"
        style={{ width: size, height: size, borderTop: stroke, borderRight: stroke }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[1px] -left-[1px] z-10"
        style={{ width: size, height: size, borderBottom: stroke, borderLeft: stroke }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[1px] -right-[1px] z-10"
        style={{ width: size, height: size, borderBottom: stroke, borderRight: stroke }}
      />
      {children}
    </div>
  );
}
