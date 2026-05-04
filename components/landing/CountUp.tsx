'use client';

import { useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
  className?: string;
};

/**
 * Counts from 0 → value when the element scrolls into view, once. Uses
 * framer-motion's animate() so it follows the same easing language as
 * the rest of the landing page.
 */
export default function CountUp({
  value,
  duration = 1.4,
  prefix = '',
  suffix = '',
  formatter,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  const text = formatter
    ? formatter(display)
    : Math.round(display).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
