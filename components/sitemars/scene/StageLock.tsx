'use client';

import { useEffect } from 'react';
import { setStageLock } from '@/components/sitenew/scene/globeSlots';

/**
 * Turns the globe centre-lock ON for /siteMARS at the viewport it was tuned to
 * (1512 × 752 — the user's screen). Every globeTransform consumer (travelling
 * globe, Vision moon + orb-bot, placer) then locks to a centred 1512×752 stage,
 * so wider/taller monitors render the SAME layout instead of drifting.
 *
 * Cleared on unmount so navigating away (e.g. to /siteNEW) restores the default
 * no-lock behaviour — the lock never leaks to other pages.
 */
const LOCK_W = 1512;
const LOCK_H = 752;

export default function StageLock() {
  useEffect(() => {
    // Desktop only. The lock maps every globeTransform onto a tuned 1512×752
    // desktop stage; on mobile the globes render as 2D fallbacks, so locking
    // would only skew layout math. Native mobile gets no lock, and we re-apply
    // if the viewport crosses the breakpoint.
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => (mq.matches ? setStageLock(LOCK_W, LOCK_H) : setStageLock());
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      setStageLock();
    };
  }, []);
  return null;
}
