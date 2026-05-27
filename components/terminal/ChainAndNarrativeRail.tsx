'use client';

import { useMemo } from 'react';
import Pill from '@/components/primitives/Pill';
import { CHAIN_ROWS } from '@/lib/terminal/chains';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';

const RECENT_PULSE_MS = 5 * 60 * 1000;

/**
 * Left rail. Three stacked sections — chain (single-select with a 2px
 * cyan accent rail), narratives (multi-select via Pill), watchlist
 * (empty placeholder for now).
 *
 * Width is owned by the parent layout; this component only manages
 * vertical rhythm.
 */
export default function ChainAndNarrativeRail() {
  const chain = useMetaStore((s) => s.chain);
  const setChain = useMetaStore((s) => s.setChain);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);
  const toggleNarrative = useMetaStore((s) => s.toggleNarrativeId);
  const timeWindow = useMetaStore((s) => s.timeWindow);
  const narrativeEvents = useMetaStore((s) => s.narrativeEvents);

  const { data } = useNarratives(timeWindow);

  // Top 10 active narratives by impact (volume) — same data as the
  // right-rail feed but ranked, not chronological.
  const topNarratives = useMemo(() => {
    const arr = (data?.narratives ?? []).slice().sort((a, b) => b.volume - a.volume).slice(0, 10);
    return arr.map((n) => ({
      narrative: n,
      tag: narrativeToTag(n),
    }));
  }, [data]);

  // Lookup table: narrativeId → most recent event timestamp (for pulse).
  const lastEventByNarrative = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of narrativeEvents) {
      const cur = m.get(e.narrativeId);
      if (!cur || e.timestamp > cur) m.set(e.narrativeId, e.timestamp);
    }
    return m;
  }, [narrativeEvents]);

  return (
    <nav
      aria-label="Filters"
      className="flex h-full flex-col gap-ds8 overflow-y-auto bg-ds-bg-base font-ds-mono"
    >
      <Section title="Chain">
        <ul role="listbox" aria-label="Chain filter" className="flex flex-col">
          {CHAIN_ROWS.map((row) => {
            const isActive = chain === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setChain(row.id)}
                  className={[
                    'relative flex h-9 w-full items-center pl-ds5 pr-ds3 text-left text-[11px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
                    isActive
                      ? 'bg-ds-bg-surface text-ds-text-primary'
                      : 'text-ds-text-secondary hover:bg-ds-bg-surface hover:text-ds-text-primary',
                  ].join(' ')}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 h-full w-[2px] bg-ds-accent-cyan"
                      style={{ boxShadow: '0 0 10px rgba(77, 212, 255, 0.55)' }}
                    />
                  )}
                  {row.label}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Narratives">
        {topNarratives.length === 0 ? (
          <p className="px-ds5 text-[10px] uppercase tracking-[0.32em] text-ds-text-tertiary">
            No active narratives
          </p>
        ) : (
          <div className="flex flex-col gap-ds2 px-ds3">
            {topNarratives.map(({ narrative, tag }) => {
              const selected = narrativeIds.includes(tag.id);
              const last = lastEventByNarrative.get(narrative.id);
              const pulse = last !== undefined && Date.now() - last < RECENT_PULSE_MS;
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleNarrative(tag.id)}
                  className={[
                    'group flex w-full items-center gap-ds2 rounded-ds-sm border px-ds2 py-ds1 text-left transition-colors duration-ds-fast ease-ds-standard',
                    selected
                      ? 'border-ds-accent-cyan/60 bg-ds-accent-cyan/10'
                      : 'border-transparent hover:bg-ds-bg-surface',
                  ].join(' ')}
                >
                  <Pill
                    variant={selected ? 'info' : 'default'}
                    size="sm"
                    pulse={pulse}
                  >
                    {tag.label}
                  </Pill>
                  <span
                    data-numeric="true"
                    className="ml-auto text-[10px] tabular-nums text-ds-text-secondary"
                    aria-label={`impact ${narrative.volume}`}
                  >
                    {narrative.volume}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Watchlist">
        <p className="px-ds5 text-[10px] uppercase leading-relaxed tracking-[0.32em] text-ds-text-tertiary">
          Star tokens to watch them here
        </p>
      </Section>
    </nav>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-ds2 pt-ds5">
      <h2 className="px-ds5 text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}
