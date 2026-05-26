'use client';

import { forwardRef, type SVGAttributes } from 'react';

type Props = Omit<SVGAttributes<SVGSVGElement>, 'children'> & {
  data: number[];
  width?: number;
  height?: number;
  /** Stroke + last-value dot colour. Defaults to design accent cyan. */
  color?: string;
};

const PADDING = 1.5;
const DEFAULT_COLOR = '#4DD4FF';

const Sparkline = forwardRef<SVGSVGElement, Props>(function Sparkline(
  {
    data,
    width = 80,
    height = 20,
    color = DEFAULT_COLOR,
    className,
    ...rest
  },
  ref
) {
  const viewBox = `0 0 ${width} ${height}`;

  if (data.length === 0) {
    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={viewBox}
        className={className}
        {...rest}
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const innerW = width - PADDING * 2;
  const innerH = height - PADDING * 2;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  // Flat series sit on the centreline rather than the bottom — looks
  // intentional, not broken.
  const flat = max === min;

  const points = data.map((v, i) => {
    const x = PADDING + i * step;
    const y = flat
      ? PADDING + innerH / 2
      : PADDING + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const d = points
    .map(([x, y], i) =>
      `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    )
    .join(' ');

  const last = points[points.length - 1];

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      aria-hidden
      {...rest}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={1.75} fill={color} />
    </svg>
  );
});

export default Sparkline;
