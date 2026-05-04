'use client';

import { useMemo } from 'react';
import centroidsRaw from '@/public/data/country-centroids.json';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import NarrativeMarker, { type CountryGroup } from './NarrativeMarker';

type Centroid = { name: string; lat: number; lng: number };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

export default function Markers() {
  const window = useMetaStore((s) => s.timeWindow);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const setSelectedCountry = useMetaStore((s) => s.setSelectedCountry);

  const { data } = useNarratives(window);

  // Group narratives by country, keep top by rank, count totals.
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

  return (
    <group>
      {groups.map((g) => (
        <NarrativeMarker
          key={g.iso}
          group={g}
          selected={selectedCountry === g.iso}
          dimmed={selectedCountry !== null && selectedCountry !== g.iso}
          onClick={(iso) =>
            setSelectedCountry(selectedCountry === iso ? null : iso)
          }
        />
      ))}
    </group>
  );
}
