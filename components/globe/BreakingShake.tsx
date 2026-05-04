'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';

/**
 * When a brand-new breaking narrative arrives, nudge the camera with a tiny
 * decaying shake. Implemented as a transient offset on the OrbitControls
 * target (which the controls then translate into a camera jitter on
 * controls.update()).
 *
 * The first dataset is treated as the baseline, so we don't shake on the
 * initial load.
 */
const SHAKE_MS = 700;
const MAX_AMPLITUDE = 0.012;

export default function BreakingShake() {
  const window = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(window);
  const seen = useRef<Set<string> | null>(null);
  const shake = useRef<{ start: number } | null>(null);
  const { controls } = useThree() as { controls: any | null };

  // Detect new breaking IDs.
  useEffect(() => {
    const ids = new Set(
      (data?.narratives ?? [])
        .filter((n) => n.category === 'breaking')
        .map((n) => n.id)
    );
    if (seen.current === null) {
      seen.current = ids;
      return;
    }
    let added = false;
    for (const id of ids) {
      if (!seen.current.has(id)) {
        added = true;
        break;
      }
    }
    if (added) shake.current = { start: performance.now() };
    seen.current = ids;
  }, [data]);

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
    // Two slightly out-of-phase sines on x/y for a tight rumble feel.
    const x = Math.sin(elapsed * 0.07) * amp;
    const y = Math.cos(elapsed * 0.083) * amp;
    controls.target.set(x, y, 0);
  });

  // Make sure we tidy up if React unmounts mid-shake.
  useEffect(() => {
    return () => {
      if (controls) controls.target.set(0, 0, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Used only for compile-time silencing; the import stays for ergonomics.
  void THREE;

  return null;
}
