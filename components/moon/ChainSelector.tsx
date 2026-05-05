'use client';

import { type ChainFilter, useMetaStore } from '@/lib/store';

const CHAINS: { id: ChainFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'solana', label: 'SOL' },
  { id: 'ethereum', label: 'ETH' },
  { id: 'base', label: 'Base' },
];

/**
 * Top-of-LeftHud segmented control. Selects the universe BEFORE the
 * trending/hot/new/etc pill filters within it. Switching chain triggers
 * the moon's existing per-token fade-out/impact pipeline.
 */
export default function ChainSelector() {
  const chain = useMetaStore((s) => s.chain);
  const setChain = useMetaStore((s) => s.setChain);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.42em] text-cyan-300/80">
        <span className="h-1 w-1 rounded-full bg-cyan-300" />
        Chain
      </div>
      <div className="flex w-full overflow-hidden rounded-sm border border-white/10 bg-[#0B1220]">
        {CHAINS.map((c) => {
          const active = chain === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (chain !== c.id) setChain(c.id);
              }}
              aria-pressed={active}
              className={[
                'flex-1 px-2 py-2 text-[10px] uppercase tracking-[0.32em] transition-colors',
                active
                  ? 'bg-neon-cyan/90 text-black shadow-neon-cyan'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/85',
              ].join(' ')}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
