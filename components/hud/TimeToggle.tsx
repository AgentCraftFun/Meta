'use client';

import { useMetaStore } from '@/lib/store';
import type { TimeWindow } from '@/lib/types';

const OPTIONS: Array<{ value: TimeWindow; label: string }> = [
  { value: '1h', label: 'Breaking Now' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
];

export default function TimeToggle() {
  const window = useMetaStore((s) => s.timeWindow);
  const setWindow = useMetaStore((s) => s.setTimeWindow);

  return (
    <div className="pointer-events-auto fixed right-[210px] top-[60px] z-30 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/40 p-1 font-mono backdrop-blur-xl">
      {OPTIONS.map((opt) => {
        const active = window === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setWindow(opt.value)}
            className={[
              'rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] transition-all',
              active
                ? 'bg-neon-cyan/90 text-black shadow-neon-cyan'
                : 'border border-transparent text-white/55 hover:border-white/15 hover:text-white/85',
            ].join(' ')}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
