'use client';

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Subscribes to the OS reduced-motion media query. Returns `false` on the
 * server (SSR-safe) and on the first client paint, then flips to the real
 * value on the next tick — preventing hydration mismatch. Updates live if
 * the user toggles the preference without reloading.
 *
 * R3F scenes consume this to disable auto-orbit; the global CSS rule
 * already collapses transitions/animations to ~0ms.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
