'use client';

import centroidsRaw from '@/public/data/country-centroids.json';
import { useMemo } from 'react';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useSurfaceTransition } from '@/lib/useSurfaceTransition';

type Centroid = { name: string };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

type Props = {
  /** Which canvas this overlay sits on. Controls extra chips like
   *  the "From: <Narrative>" carryover chip that only shows on Moon. */
  surface: 'earth' | 'moon';
};

/**
 * Floating filter-chip strip anchored top-centre of an Earth or Moon
 * canvas. Same chip vocabulary as the Terminal — clicking × clears
 * that filter dimension. When the user arrives on the Moon via the
 * Earth → Moon transition with a narrative carryover, the From: chip
 * is the carryover-narrative.
 */
export default function CanvasFilterChips({ surface }: Props) {
  const window = useMetaStore((s) => s.timeWindow);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);
  const toggleNarrative = useMetaStore((s) => s.toggleNarrativeId);
  const clearNarratives = useMetaStore((s) => s.clearNarrativeIds);
  const chain = useMetaStore((s) => s.chain);
  const setChain = useMetaStore((s) => s.setChain);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const setSelectedCountry = useMetaStore((s) => s.setSelectedCountry);
  const carryover = useSurfaceTransition((s) => s.carryover);
  const clearCarryover = useSurfaceTransition((s) => s.clearCarryover);

  const { data } = useNarratives(window);

  const tagsById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of data?.narratives ?? []) {
      m.set(n.id, narrativeToTag(n).label);
    }
    return m;
  }, [data]);

  const hasNarrativeFilter = narrativeIds.length > 0;
  const hasChainFilter = chain !== 'all';
  const hasCountryFilter = surface === 'earth' && !!selectedCountry;
  const carryoverChip = surface === 'moon' && carryover?.narrativeLabel;

  if (
    !hasNarrativeFilter &&
    !hasChainFilter &&
    !hasCountryFilter &&
    !carryoverChip
  ) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Active filters"
      className="pointer-events-none fixed left-1/2 top-[60px] z-[35] flex max-w-[80vw] -translate-x-1/2 flex-wrap items-center justify-center gap-ds2 font-ds-mono"
    >
      {carryoverChip && (
        <Chip
          label={`From: ${carryover.narrativeLabel}`}
          tone="info"
          ariaLabel={`Carryover narrative: ${carryover.narrativeLabel}`}
          onClear={() => {
            clearNarratives();
            clearCarryover();
          }}
        />
      )}

      {hasCountryFilter && (
        <Chip
          label={CENTROIDS[selectedCountry!]?.name ?? selectedCountry!}
          tone="default"
          ariaLabel={`Clear country filter: ${selectedCountry}`}
          onClear={() => setSelectedCountry(null)}
        />
      )}

      {hasChainFilter && (
        <Chip
          label={chain.toUpperCase()}
          tone="default"
          ariaLabel={`Clear chain filter: ${chain}`}
          onClear={() => setChain('all')}
        />
      )}

      {narrativeIds.map((id) => (
        <Chip
          key={id}
          label={tagsById.get(id) ?? id}
          tone="info"
          ariaLabel={`Clear narrative filter: ${tagsById.get(id) ?? id}`}
          onClear={() => toggleNarrative(id)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  tone,
  ariaLabel,
  onClear,
}: {
  label: string;
  tone: 'default' | 'info';
  ariaLabel: string;
  onClear: () => void;
}) {
  const classes =
    tone === 'info'
      ? 'border-ds-accent-cyan/50 bg-ds-accent-cyan/10 text-ds-accent-cyan'
      : 'border-ds-border-strong bg-ds-bg-surface text-ds-text-primary';
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={ariaLabel}
      className={[
        'pointer-events-auto inline-flex h-6 items-center gap-ds2 rounded-ds-sm border px-ds2 text-[10px] uppercase tracking-[0.32em] backdrop-blur-md hover:opacity-100',
        classes,
      ].join(' ')}
    >
      <span>{label}</span>
      <span aria-hidden className="opacity-70">×</span>
    </button>
  );
}
