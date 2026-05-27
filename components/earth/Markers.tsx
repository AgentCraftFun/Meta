'use client';

import { useCallback, useMemo } from 'react';
import centroidsRaw from '@/public/data/country-centroids.json';
import { playTick } from '@/lib/sound';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import NarrativeMarker, { type CountryGroup } from './NarrativeMarker';

type Centroid = { name: string; lat: number; lng: number };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

export default function Markers() {
  const window = useMetaStore((s) => s.timeWindow);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);

  const { data } = useNarratives(window);

  const groups = useMemo<CountryGroup[]>(() => {
    if (!data?.narratives.length) return [];
    const byCountry = new Map<
      string,
      { items: typeof data.narratives; total: number }
    >();
    for (const n of data.narratives) {
      const e = byCountry.get(n.country) ?? { items: [], total: 0 };
      e.items.push(n);
      e.total += 1;
      byCountry.set(n.country, e);
    }

    const out: CountryGroup[] = [];
    for (const [iso, { items, total }] of byCountry) {
      const centroid = CENTROIDS[iso];
      if (!centroid) continue;
      const top = items.slice().sort((a, b) => a.rank - b.rank)[0];
      out.push({
        iso,
        name: centroid.name,
        lat: centroid.lat,
        lng: centroid.lng,
        top,
        total,
      });
    }
    return out;
  }, [data?.narratives]);

  /** Pre-compute country → matches-narrative-filter so each marker
   *  doesn't recompute the lookup on every render. Empty filter
   *  list = everything matches (no dimming). */
  const matchesByCountry = useMemo(() => {
    const m = new Map<string, boolean>();
    if (narrativeIds.length === 0) {
      for (const g of groups) m.set(g.iso, true);
      return m;
    }
    const filterSet = new Set(narrativeIds);
    const byCountry = new Map<string, string[]>();
    for (const n of data?.narratives ?? []) {
      const arr = byCountry.get(n.country) ?? [];
      arr.push(n.id);
      byCountry.set(n.country, arr);
    }
    for (const g of groups) {
      const ids = byCountry.get(g.iso) ?? [];
      m.set(g.iso, ids.some((id) => filterSet.has(id)));
    }
    return m;
  }, [groups, narrativeIds, data?.narratives]);

  // Stable click callback so memoised markers don't churn on every render.
  const onClick = useCallback((iso: string) => {
    const {
      muted,
      selectedCountry: current,
      setSelectedCountry,
    } = useMetaStore.getState();
    if (!muted) playTick();
    setSelectedCountry(current === iso ? null : iso);
  }, []);

  return (
    <group>
      {groups.map((g) => {
        const matches = matchesByCountry.get(g.iso) ?? true;
        // Two dim sources: explicit country selection OR a narrative
        // filter that excludes this pin. Filter-dim is the heavier
        // signal — pulls to 25% opacity per spec.
        const filterDim = !matches;
        const selectionDim =
          selectedCountry !== null && selectedCountry !== g.iso;
        return (
          <NarrativeMarker
            key={g.iso}
            group={g}
            selected={selectedCountry === g.iso}
            dimmed={selectionDim}
            filterDim={filterDim}
            onClick={onClick}
          />
        );
      })}
    </group>
  );
}
