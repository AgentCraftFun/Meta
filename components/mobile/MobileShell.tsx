'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useIsMobile } from '@/lib/useIsMobile';

// Lazy-load MobileApp so the desktop bundle never carries it. Skip
// the SSR pass — the viewport check is client-only anyway.
const MobileApp = dynamic(() => import('./MobileApp'), { ssr: false });

type Props = {
  /** The desktop render tree — pass-through children. */
  children: ReactNode;
};

/** Routes that intentionally bypass the mobile shell. /siteview is
 *  responsive marketing; /design is a dev surface. */
const PASSTHROUGH = ['/siteview', '/siteNEW', '/design'];

/**
 * Viewport-aware shell. Mounted in app/layout.tsx around `children`:
 *
 *   desktop  → renders children (the existing routes + global chrome
 *              via app/layout.tsx).
 *   mobile   → renders <MobileApp /> instead, with its own top bar,
 *              tab bar, and screen tree. The Three.js bundle never
 *              loads because the dynamic Earth/Moon imports inside
 *              `children` are never reached.
 *
 * SSR + first hydration paint as desktop so the server output is
 * stable; the swap happens on the next client tick via the
 * useIsMobile hook.
 */
export default function MobileShell({ children }: Props) {
  const { isMobile, hydrated } = useIsMobile();
  const pathname = usePathname() ?? '/';

  // Bypass the shell on marketing / dev surfaces.
  if (PASSTHROUGH.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // SSR / first paint always renders desktop. We don't render NULL
  // here because the page would flash empty between hydration and
  // the matchMedia read.
  if (!hydrated || !isMobile) return <>{children}</>;

  return <MobileApp />;
}
