'use client';

import { useEffect, useRef } from 'react';
import { useMetaStore } from '@/lib/store';
import type { Narrative } from '@/lib/types';
import type {
  NarrativeEvent,
  NarrativeEventType,
} from '@/lib/types/narrativeEvent';
import { useNarratives } from '@/lib/useNarratives';

const MIN_INTERVAL_MS = 4000;
const MAX_INTERVAL_MS = 8000;
const MIN_GAP_MS = 2000;

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickEventType(): NarrativeEventType {
  const r = Math.random();
  if (r < 0.6) return 'new-story';
  if (r < 0.9) return 'momentum-shift';
  return 'cross-country';
}

function fabricateEvent(narratives: Narrative[]): NarrativeEvent | null {
  if (narratives.length === 0) return null;
  const type = pickEventType();
  const base = pick(narratives);

  if (type === 'cross-country') {
    // Find up to 3 other countries — random sample by ISO code.
    const others = Array.from(
      new Set(
        narratives
          .filter((n) => n.country !== base.country)
          .map((n) => n.country)
      )
    );
    const sample: string[] = [];
    while (sample.length < Math.min(3, others.length)) {
      const idx = Math.floor(Math.random() * others.length);
      if (!sample.includes(others[idx])) sample.push(others[idx]);
    }
    return {
      id: uid('nev'),
      type,
      timestamp: Date.now(),
      country: base.country,
      narrativeId: base.id,
      title: base.title,
      impact: Math.min(100, Math.round(base.volume + 5 + Math.random() * 10)),
      category: base.category,
      relatedCountries: sample,
    };
  }

  // For momentum-shift, simulate a +15-35% impact bump.
  const impact =
    type === 'momentum-shift'
      ? Math.min(100, Math.round(base.volume + 15 + Math.random() * 20))
      : Math.round(base.volume);

  return {
    id: uid('nev'),
    type,
    timestamp: Date.now(),
    country: base.country,
    narrativeId: base.id,
    title: base.title,
    impact,
    category: base.category,
  };
}

/**
 * Headless: pushes synthetic narrative events into the store on a random
 * 4–8s interval. Pauses while the tab is hidden. Mirrors the structure of
 * the moon's LiveFeedSimulator so the two feeds feel like the same heartbeat
 * applied to two different domains.
 */
export default function NarrativeFeedSimulator() {
  const window_ = useMetaStore((s) => s.timeWindow);
  const { data } = useNarratives(window_);

  const narrativesRef = useRef<Narrative[]>([]);
  narrativesRef.current = data?.narratives ?? [];

  const lastEmitRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const hiddenRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => {
      hiddenRef.current = document.visibilityState === 'hidden';
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay =
        MIN_INTERVAL_MS +
        Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
      timerRef.current = window.setTimeout(emit, delay);
    };

    const emit = () => {
      if (hiddenRef.current) {
        schedule();
        return;
      }
      const now = Date.now();
      if (now - lastEmitRef.current < MIN_GAP_MS) {
        schedule();
        return;
      }
      const evt = fabricateEvent(narrativesRef.current);
      if (evt) {
        useMetaStore.getState().pushNarrativeEvent(evt);
        lastEmitRef.current = now;
      }
      schedule();
    };

    schedule();
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
