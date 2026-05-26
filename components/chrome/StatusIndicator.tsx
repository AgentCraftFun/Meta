'use client';

import { useEffect, useState } from 'react';
import { useMetaStore } from '@/lib/store';
import { formatUtcClock } from '@/lib/time';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';

const FRESH_MS = 60_000;
const STALE_MS = 5 * 60_000;

type Status = 'fresh' | 'stale' | 'failed';

function classifyStatus(
  lastUpdate: number,
  hasError: boolean,
  now: number
): Status {
  if (hasError) return 'failed';
  if (lastUpdate === 0) return 'stale';
  const age = now - lastUpdate;
  if (age < FRESH_MS) return 'fresh';
  if (age < STALE_MS) return 'stale';
  return 'failed';
}

const STATUS_CLASS: Record<Status, { dot: string; label: string }> = {
  fresh: {
    dot: 'bg-ds-accent-bull',
    label: 'Live',
  },
  stale: {
    dot: 'bg-ds-accent-warn',
    label: 'Stale',
  },
  failed: {
    dot: 'bg-ds-accent-bear',
    label: 'Failed',
  },
};

/**
 * Data-freshness pulse + UTC clock. Status is derived from the most
 * recent successful React Query update across tokens + narratives.
 */
export default function StatusIndicator() {
  const window = useMetaStore((s) => s.timeWindow);
  const tokens = useTokens(window);
  const narratives = useNarratives(window);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const lastUpdate = Math.max(
    tokens.dataUpdatedAt || 0,
    narratives.dataUpdatedAt || 0
  );
  const hasError = Boolean(tokens.error || narratives.error);
  const status = classifyStatus(lastUpdate, hasError, now);
  const { dot, label } = STATUS_CLASS[status];

  const clock = formatUtcClock(new Date(now));

  return (
    <div
      className="flex items-center gap-ds2 font-ds-mono"
      role="status"
      aria-live="polite"
      aria-label={`Data ${label.toLowerCase()}, ${clock}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-ds-full ${dot} ${
          status === 'fresh' ? 'animate-ds-pulse' : ''
        }`}
      />
      <span className="text-[10px] uppercase tracking-[0.32em] text-ds-text-secondary">
        {label}
      </span>
      <span
        data-numeric="true"
        className="text-[10px] tabular-nums tracking-[0.3em] text-ds-text-tertiary"
      >
        {clock}
      </span>
    </div>
  );
}
