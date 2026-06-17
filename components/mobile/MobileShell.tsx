import type { ReactNode } from 'react';

/**
 * Pass-through wrapper. The public site is Starship Protocol only now, so the
 * legacy MetaMap mobile app (MobileApp) is retired: every route renders its own
 * responsive tree on mobile and desktop alike, instead of the mobile MetaMap
 * terminal hijacking the viewport. Kept as a thin wrapper so app/layout.tsx
 * structure stays stable.
 */
export default function MobileShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
