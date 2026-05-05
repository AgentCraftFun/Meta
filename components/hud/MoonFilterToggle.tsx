'use client';

import { MOON_FILTERS } from '@/lib/moonFlags';
import { useMetaStore } from '@/lib/store';

/**
 * Replacement for TimeToggle on /moon. Five pills (TRENDING / HOT / NEW /
 * GAINERS / LOSERS) wired to useMetaStore.moonFilter. Visual language
 * mirrors TimeToggle exactly so the HUD stays cohesive across surfaces.
 */
export default function MoonFilterToggle() {
  const filter = useMetaStore((s) => s.moonFilter);
  const setFilter = useMetaStore((s) => s.setMoonFilter);

  return (
    <div className="pointer-events-auto fixed right-[200px] top-5 z-30 flex items-center gap-1 rounded-sm border border-white/10 bg-black/40 p-1 font-mono backdrop-blur-xl">
      {MOON_FILTERS.map((opt) => {
        const active = filter === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={[
              'rounded-sm px-2.5 py-1.5 text-[10px] uppercase tracking-[0.28em] transition-all',
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
