'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  type MotionValue,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { spring } from './system/motion';
import { useSceneStore } from './system/useSceneStore';

type Render = (mv: { x: MotionValue<number>; y: MotionValue<number> }) => ReactNode;

type Props = {
  children: ReactNode | Render;
  /** Max pixel offset toward the cursor. */
  max?: number;
  className?: string;
  /** Force-disable (else auto-disables on reduced-motion / coarse pointer). */
  disabled?: boolean;
};

/**
 * Cursor-follow wrapper. The element translates toward the pointer up to `max`
 * px on the `magnetic` spring (stiffness 150 / damping 15 / mass 0.5), springing
 * back to rest on leave. Children may be a render-prop receiving the x/y motion
 * values (e.g. for counter-translating inner text).
 *
 * Disabled on reduced-motion and coarse (touch) pointers — renders inert.
 */
export default function Magnetic({ children, max = 6, className, disabled }: Props) {
  const reduced = useSceneStore((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const x = useSpring(xRaw, spring.magnetic);
  const y = useSpring(yRaw, spring.magnetic);

  const isCoarse =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches;
  const off = disabled ?? (reduced || isCoarse);

  const render = (node: ReactNode) =>
    typeof children === 'function' ? (children as Render)({ x, y }) : node;

  if (off) {
    return <div className={className}>{render(children as ReactNode)}</div>;
  }

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, max);
    xRaw.set((dx / len) * clamped);
    yRaw.set((dy / len) * clamped);
  };

  const onLeave = () => {
    xRaw.set(0);
    yRaw.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {render(children as ReactNode)}
    </motion.div>
  );
}
