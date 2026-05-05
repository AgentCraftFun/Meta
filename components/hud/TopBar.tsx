'use client';

import { useEffect, useState } from 'react';
import { formatUtcClock } from '@/lib/time';

type Props = {
  /** Optional surface label appended after the wordmark, e.g. "MOON". */
  suffix?: string;
};

export default function TopBar({ suffix }: Props) {
  const [clock, setClock] = useState('');
  useEffect(() => {
    setClock(formatUtcClock());
    const id = setInterval(() => setClock(formatUtcClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed left-5 top-5 z-30 flex flex-col gap-1.5 font-mono">
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-semibold uppercase tracking-[0.45em] text-white">
          MetaMap
        </span>
        {suffix && (
          <>
            <span aria-hidden className="text-[15px] text-white/30">
              /
            </span>
            <span className="text-[15px] font-semibold uppercase tracking-[0.45em] text-white">
              {suffix}
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.4em] text-neon-cyan/85">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan shadow-neon-cyan" />
          Live
        </span>
      </div>
      <div className="text-[10px] tracking-[0.3em] text-white/50 tabular-nums">
        {clock || '—— : —— : —— UTC'}
      </div>
    </div>
  );
}
