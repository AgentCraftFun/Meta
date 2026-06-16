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
    setStageLock(LOCK_W, LOCK_H);
    return () => setStageLock();
  }, []);
  return null;
}
