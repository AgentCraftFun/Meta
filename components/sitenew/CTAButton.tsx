'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import Magnetic from './Magnetic';
import { color, dur, ease, spring } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

type Props = {
  href: string;
  children: ReactNode;
  size?: 'md' | 'lg';
};

/**
 * Armed-system CTA. On hover:
 *   - 4 corner brackets snap inward 8px → 0   (0.2s snappy)
 *   - cyan fill wipes left → right            (0.25s powerOut, clip-path)
 *   - a targeting reticle ring pulses once
 * Wrapped in <Magnetic> (button drifts ≤6px toward cursor; label counter-
 * translates 2px the other way).
 *
 * REDUCED-MOTION / touch: Magnetic inert; fill + brackets resolve via a short
 * opacity/instant change, reticle pulse skipped.
 */
export default function CTAButton({ href, children, size = 'md' }: Props) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const [hover, setHover] = useState(false);
  const padding =
    size === 'lg' ? 'px-12 py-6 text-[18px]' : 'px-8 py-[18px] text-[14px]';

  const bracketT = reduced
    ? { duration: 0.12 }
    : (spring.snappy as object);
  const fillT = reduced
    ? { duration: 0.12 }
    : { duration: dur.fast + 0.05, ease: ease.powerOut };

  return (
    <Magnetic max={6}>
      {({ x }: { x: MotionValue<number> }) => (
        <Link
          href={href}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={[
            'group relative inline-flex items-center gap-3 overflow-hidden border font-mono uppercase tracking-[0.32em]',
            padding,
          ].join(' ')}
          style={{
            borderColor: hover ? color.cyan : 'rgba(34,211,238,0.7)',
            color: hover ? color.bg : color.cyan,
            transition: 'color 0.2s, border-color 0.2s',
          }}
        >
          {/* cyan fill — clip wipe left→right */}
          <motion.span
            aria-hidden
            className="absolute inset-0 z-0"
            style={{ background: color.cyan }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: hover ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
            transition={fillT}
          />

          {/* targeting reticle — one-shot pulse on hover */}
          {!reduced && hover && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 border"
              style={{ borderColor: color.bg }}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.18 }}
              transition={{ duration: dur.base, ease: ease.powerOut }}
            />
          )}

          {/* corner brackets — snap inward on hover */}
          <Bracket pos="tl" hover={hover} transition={bracketT} />
          <Bracket pos="tr" hover={hover} transition={bracketT} />
          <Bracket pos="bl" hover={hover} transition={bracketT} />
          <Bracket pos="br" hover={hover} transition={bracketT} />

          <CounterLabel x={x} reduced={reduced}>
            {children}
          </CounterLabel>
        </Link>
      )}
    </Magnetic>
  );
}

function CounterLabel({
  x,
  reduced,
  children,
}: {
  x: MotionValue<number>;
  reduced: boolean;
  children: ReactNode;
}) {
  // Counter-translate the label up to 2px against the 6px magnetic drift.
  const cx = useTransform(x, (v) => (reduced ? 0 : -v * 0.33));
  return (
    <motion.span
      className="relative z-10 inline-flex items-center gap-3"
      style={{ x: cx }}
    >
      <span>{children}</span>
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </motion.span>
  );
}

const SIZE = 9;
type Offset = { x: number; y: number };
const POS: Record<string, { style: React.CSSProperties; rest: Offset; on: Offset }> = {
  tl: { style: { top: 0, left: 0, borderTop: '1.5px solid', borderLeft: '1.5px solid' }, rest: { x: -8, y: -8 }, on: { x: 0, y: 0 } },
  tr: { style: { top: 0, right: 0, borderTop: '1.5px solid', borderRight: '1.5px solid' }, rest: { x: 8, y: -8 }, on: { x: 0, y: 0 } },
  bl: { style: { bottom: 0, left: 0, borderBottom: '1.5px solid', borderLeft: '1.5px solid' }, rest: { x: -8, y: 8 }, on: { x: 0, y: 0 } },
  br: { style: { bottom: 0, right: 0, borderBottom: '1.5px solid', borderRight: '1.5px solid' }, rest: { x: 8, y: 8 }, on: { x: 0, y: 0 } },
};

function Bracket({
  pos,
  hover,
  transition,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
  hover: boolean;
  transition: object;
}) {
  const p = POS[pos];
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute z-20"
      style={{ width: SIZE, height: SIZE, color: color.cyan, ...p.style }}
      initial={p.rest}
      animate={hover ? p.on : p.rest}
      transition={transition}
    />
  );
}
