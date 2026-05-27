'use client';

import { useEffect } from 'react';

/**
 * Dev-only axe-core runner. Loads @axe-core/react lazily so the
 * library never ships to production. Pings axe once per page mount
 * and on every router transition.
 *
 * Mount once in app/layout.tsx — it returns null and renders nothing.
 * Open DevTools and look for the [Axe] group in the console.
 */
export default function AxeRunner() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (typeof window === 'undefined') return;
    let cancelled = false;
    (async () => {
      try {
        const [{ default: React }, { default: ReactDOM }, axe] =
          await Promise.all([
            import('react'),
            import('react-dom'),
            import('@axe-core/react'),
          ]);
        if (cancelled) return;
        axe.default(React, ReactDOM, 1000);
      } catch (err) {
        console.warn('[AxeRunner] failed to load axe', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
