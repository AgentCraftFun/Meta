'use client';

import { forwardRef, type HTMLAttributes } from 'react';

export type DeltaFormat = 'percent' | 'abs';

type Props = HTMLAttributes<HTMLSpanElement> & {
  value: number;
  format?: DeltaFormat;
};

/** Anything inside ±0.01 reads as neutral so we don't flag rounding noise. */
const NEUTRAL_THRESHOLD = 0.01;

function formatValue(value: number, format: DeltaFormat): string {
  const abs = Math.abs(value);
  if (format === 'percent') return `${abs.toFixed(2)}%`;
  return abs.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

const Delta = forwardRef<HTMLSpanElement, Props>(function Delta(
  { value, format = 'percent', className, ...rest },
  ref
) {
  const neutral = Math.abs(value) < NEUTRAL_THRESHOLD;
  const positive = !neutral && value > 0;

  const color = neutral
    ? 'text-ds-text-secondary'
    : positive
      ? 'text-ds-accent-bull'
      : 'text-ds-accent-bear';

  const glyph = neutral ? '·' : positive ? '▲' : '▼';

  return (
    <span
      ref={ref}
      data-numeric="true"
      className={[
        'inline-flex items-baseline gap-1 font-ds-mono',
        color,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span aria-hidden>{glyph}</span>
      <span>{formatValue(value, format)}</span>
    </span>
  );
});

export default Delta;
