'use client';

import { useEffect, useState } from 'react';

// 1023px upper bound — anything tablet-sized or smaller gets the
// mobile UI. Matches the desktop globe's effective floor where the
// 3D scene starts to feel cramped.
const QUERY = '(max-width: 1023px)';

type Result = {
  /** True only after first client mount AND matchMedia reports mobile.
   *  Server renders `false` so SSR + first hydration paint as desktop;
   *  the swap happens on the next tick via setIsMobile. */
  isMobile: boolean;
  /** True after the client has read matchMedia once. Components that
   *  need to defer rendering until the choice is known can gate on
   *  this. */
  hydrated: boolean;
};

/**
 * Single mobile-detection hook reused across the mobile shell. The
 * breakpoint matches Tailwind's `md` (768px) — anything narrower
 * gets the mobile experience. Live-updates on rotation / window
 * resize so the desktop UI returns when the viewport widens.
 */
export function useIsMobile(): Result {
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    setIsMobile(mql.matches);
    setHydrated(true);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return { isMobile, hydrated };
}
