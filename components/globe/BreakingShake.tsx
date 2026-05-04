'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useMetaStore } from '@/lib/store';
import type { TimeWindow } from '@/lib/types';
import { useNarratives } from '@/lib/useNarratives';

/**
 * When a brand-new breaking narrative arrives, nudge the camera with a tiny
 * decaying shake on the OrbitControls target.
 *
 * The baseline set of "seen" breaking IDs is kept per time window. Switching
 * windows seeds a fresh baseline rather than diffing against the previous
 * window's set — otherwise every toggle would trigger a spurious shake just
 * because more (or fewer) narratives qualify as breaking under a different
 * window's rules.
 */
const SHAKE_MS = 700;
const MAX_AMPLITUDE = 0.012;

export default function BreakingShake() {
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(window);
  const seenByWindow = useRef<Map<TimeWindow, Set<string>>>(new Map());
  const shake = useRef<{ start: number } | null>(null);
  const { controls } = useThree() as { controls: any | null };

  useEffect(() => {
    const ids = new Set(
      (data?.narratives ?? [])
        .filter((n) => n.category === 'breaking')
        .map((n) => n.id)
    );
    const prev = seenByWindow.current.get(window);
    if (!prev) {
      // First dataset for this window — set baseline, no shake.
      seenByWindow.current.set(window, ids);
      return;
    }
    let added = false;
    for (const id of ids) {
      if (!prev.has(id)) {
        added = true;
        break;
      }
    }
    if (added) shake.current = { start: performance.now() };
    seenByWindow.current.set(window, ids);
  }, [data, window]);

  useFrame(() => {
    if (!controls || !shake.current) return;
    const elapsed = performance.now() - shake.current.start;
    if (elapsed > SHAKE_MS) {
      controls.target.set(0, 0, 0);
      shake.current = null;
      return;
    }
    const t = elapsed / SHAKE_MS;
    const decay = Math.pow(1 - t, 2.5);
    const amp = MAX_AMPLITUDE * decay;
    const x = Math.sin(elapsed * 0.07) * amp;
    const y = Math.cos(elapsed * 0.083) * amp;
    controls.target.set(x, y, 0);
  });

  useEffect(() => {
    return () => {
      if (controls) controls.target.set(0, 0, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
