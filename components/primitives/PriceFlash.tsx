'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  /** Numeric value driving the flash direction. */
  value: number;
  /** Already-formatted string to display. Kept separate from `value` so
   *  the wrapper can compare numerically while rendering whatever
   *  format the parent picked (USD / percent / etc.). */
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps a price value and briefly flashes the background green or red
 * when the value changes — the price-column micro-interaction the
 * polish brief calls for. Used on the token-detail PRICE tile and the
 * Terminal table's Price column.
 *
 * Reduced-motion users get no flash — the underlying CSS keyframe
 * resolves to 0.01ms via the global `@media (prefers-reduced-motion)`
 * rule in globals.css, so the colour swap never reaches a perceptible
 * frame.
 */
export default function PriceFlash({ value, children, className }: Props) {
  const previous = useRef<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const prev = previous.current;
    previous.current = value;
    if (prev === null) return; // first paint — don't flash
    if (Math.abs(value - prev) < 1e-12) return;
    setDirection(value > prev ? 'up' : 'down');
    // Bump a counter so AnimationEnd → CSS reset works even when the
    // same direction fires twice in a row.
    setTick((t) => t + 1);
  }, [value]);

  const animationClass =
    direction === 'up'
      ? 'animate-ds-flash-up'
      : direction === 'down'
        ? 'animate-ds-flash-down'
        : '';

  return (
    <span
      // Key resets the animation when tick advances — same trick as
      // re-mounting the node, without churning React state above.
      key={tick}
      className={[
        'inline-block rounded-[2px] px-[2px]',
        animationClass,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
