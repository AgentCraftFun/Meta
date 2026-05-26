'use client';

import { forwardRef, type HTMLAttributes } from 'react';

export type PillVariant = 'default' | 'bull' | 'bear' | 'warn' | 'info';
export type PillSize = 'sm' | 'md';

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: PillVariant;
  size?: PillSize;
  /** 1.5s opacity pulse (0.6 → 1.0). Auto-disabled under prefers-reduced-motion
   *  via the global CSS rule. */
  pulse?: boolean;
};

const VARIANT: Record<PillVariant, string> = {
  default:
    'bg-ds-bg-surfaceHi text-ds-text-secondary border-ds-border-subtle',
  bull: 'bg-ds-accent-bull/10 text-ds-accent-bull border-ds-accent-bull/40',
  bear: 'bg-ds-accent-bear/10 text-ds-accent-bear border-ds-accent-bear/40',
  warn: 'bg-ds-accent-warn/10 text-ds-accent-warn border-ds-accent-warn/40',
  info: 'bg-ds-accent-cyan/10 text-ds-accent-cyan border-ds-accent-cyan/40',
};

const SIZE: Record<PillSize, string> = {
  sm: 'h-[18px] px-2 text-[9px] tracking-[0.32em]',
  md: 'h-[22px] px-2.5 text-[10px] tracking-[0.36em]',
};

const Pill = forwardRef<HTMLSpanElement, Props>(function Pill(
  { variant = 'default', size = 'md', pulse = false, className, children, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-1.5 border font-ds-mono uppercase rounded-ds-sm',
        VARIANT[variant],
        SIZE[size],
        pulse ? 'animate-ds-pulse' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
});

export default Pill;
