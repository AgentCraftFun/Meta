'use client';

import { useEffect, useRef } from 'react';
import { playTick } from '@/lib/sound';
import { useMetaStore } from '@/lib/store';

const HIGH_IMPACT_THRESHOLD = 75;

/**
 * Plays a quiet 80ms tick when a new high-impact narrative event
 * (impact > 75) arrives in the live feed. Respects the global mute
 * flag — defaults to muted, so the user has to opt in via the
 * settings popover. No visual rendering.
 */
export default function HighImpactSoundCue() {
  const events = useMetaStore((s) => s.narrativeEvents);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (events.length === 0) return;
    const { muted } = useMetaStore.getState();
    if (muted) {
      // Track event ids anyway so unmuting mid-session doesn't replay
      // history all at once.
      for (const e of events) seen.current.add(e.id);
      return;
    }
    for (const e of events) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      if (e.impact > HIGH_IMPACT_THRESHOLD) {
        playTick(0.04);
      }
    }
  }, [events]);

  return null;
}
