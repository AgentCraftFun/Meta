'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

const TRIGGER_DISTANCE = 64;
const MAX_PULL = 96;

type Props = {
  /** Async callback fired when the pull crosses TRIGGER_DISTANCE. */
  onRefresh: () => Promise<unknown> | unknown;
  children: ReactNode;
};

/**
 * Touch-only pull-to-refresh. Tracks the first downward drag while
 * the scroll container is at scrollTop=0 and pulls a small spinner
 * down with the finger. Releasing past TRIGGER_DISTANCE fires
 * onRefresh; releasing earlier snaps back.
 *
 * Implementation is deliberately simple (no momentum, no overscroll
 * physics) — we're matching the iOS native gesture, not reinventing
 * it. CSS does the snap via a 200ms transition when the pull is
 * released.
 */
export default function PullToRefresh({ onRefresh, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [released, setReleased] = useState(true);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setReleased(false);
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) {
      startY.current = null;
      setPull(0);
      setReleased(true);
      return;
    }
    // Rubber-band: scale the pull so it feels resistant past trigger.
    const scaled = Math.min(MAX_PULL, dy * 0.5);
    setPull(scaled);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    const shouldRefresh = pull >= TRIGGER_DISTANCE;
    startY.current = null;
    setReleased(true);
    if (!shouldRefresh) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  }, [pull, onRefresh]);

  const indicatorOpacity = Math.min(1, pull / TRIGGER_DISTANCE);
  const ready = pull >= TRIGGER_DISTANCE;

  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 flex items-center justify-center font-ds-mono"
        style={{
          top: 0,
          height: pull || (refreshing ? TRIGGER_DISTANCE : 0),
          transition: released ? 'height 200ms cubic-bezier(0.4,0,0.2,1)' : 'none',
          opacity: refreshing ? 1 : indicatorOpacity,
        }}
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-ds-accent-cyan">
          {refreshing ? 'Refreshing…' : ready ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      <div
        style={{
          transform: `translateY(${refreshing ? TRIGGER_DISTANCE : pull}px)`,
          transition: released ? 'transform 200ms cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
