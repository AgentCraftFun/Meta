'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = HTMLMotionProps<'div'> & {
  children: ReactNode;
  delay?: number;
};

/**
 * Standard scroll-into-view animation: fade in + 16px translate-up over 600ms
 * with ease-out. Once-only; no scroll-jacking.
 */
export default function FadeUp({ children, delay = 0, ...props }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
