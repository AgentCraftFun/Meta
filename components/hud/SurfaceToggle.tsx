'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import centroidsRaw from '@/public/data/country-centroids.json';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';
import {
  type Carryover,
  type Surface,
  useSurfaceTransition,
} from '@/lib/useSurfaceTransition';

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'earth', label: 'Earth' },
  { id: 'moon', label: 'Moon' },
];

type Centroid = { name: string };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

function activeSurface(path: string): Surface {
  if (path.startsWith('/moon')) return 'moon';
  return 'earth';
}

/**
 * In-canvas Earth ◯ Moon toggle. Triggers the cinematic
 * SurfaceTransition. When the user has a narrative selected on Earth
 * or a token selected on the Moon, the toggle bundles a `carryover`
 * payload so the destination surface lands pre-filtered.
 *
 *   Earth → Moon  carries:  selectedCountry's top narrative id (if a
 *                           narrative filter is active, that wins)
 *   Moon  → Earth carries:  selected token's primary narrative
 *                           country (camera flies there on landing)
 */
export default function SurfaceToggle() {
  const pathname = usePathname() ?? '/';
  const active = activeSurface(pathname);
  const start = useSurfaceTransition((s) => s.start);
  const phase = useSurfaceTransition((s) => s.phase);

  const window = useMetaStore((s) => s.timeWindow);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);
  const { data: narrativesData } = useNarratives(window);
  const { data: tokensData } = useTokens(window);

  const carryover = useMemo<Carryover | undefined>(() => {
    if (active === 'earth') {
      // Prefer an explicit narrative filter — first id wins. Otherwise
      // fall back to the top narrative of the selected country.
      const ns = narrativesData?.narratives ?? [];
      if (narrativeIds.length > 0) {
        const n = ns.find((x) => x.id === narrativeIds[0]);
        if (n) {
          const tag = narrativeToTag(n);
          return { narrativeId: n.id, narrativeLabel: tag.label };
        }
      }
      if (selectedCountry) {
        const n = ns
          .filter((x) => x.country === selectedCountry)
          .sort((a, b) => b.volume - a.volume)[0];
        if (n) {
          const tag = narrativeToTag(n);
          return { narrativeId: n.id, narrativeLabel: tag.label };
        }
      }
      return undefined;
    }
    // active === 'moon' — going to Earth.
    if (!selectedTokenId) return undefined;
    const tok = (tokensData?.tokens ?? []).find((t) => t.id === selectedTokenId);
    if (!tok) return undefined;
    // The narrative the user is "tracking" via this token — use its
    // primary country to anchor Earth's camera.
    const firstTag = tok.narrativeTags[0];
    const country = firstTag?.countryISO;
    if (!country || !CENTROIDS[country]) return undefined;
    return {
      tokenId: tok.id,
      countryISO: country,
      narrativeId: firstTag?.id,
      narrativeLabel: firstTag?.label,
    };
  }, [
    active,
    selectedCountry,
    selectedTokenId,
    narrativeIds,
    narrativesData,
    tokensData,
  ]);

  const navigate = (target: Surface) => {
    if (target === active) return;
    if (phase !== 'idle') return;
    start(active, target, carryover);
  };

  return (
    <div className="pointer-events-auto fixed right-5 top-[60px] z-30 flex items-center gap-1.5 rounded-sm border border-white/10 bg-black/40 p-1 font-mono backdrop-blur-xl">
      {SURFACES.map((s, i) => {
        const isActive = s.id === active;
        return (
          <span key={s.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(s.id)}
              aria-current={isActive ? 'page' : undefined}
              disabled={isActive || phase !== 'idle'}
              className={[
                'rounded-sm px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] transition-all disabled:cursor-default',
                isActive
                  ? 'bg-neon-cyan/90 text-black shadow-neon-cyan'
                  : 'border border-transparent text-white/55 hover:border-white/15 hover:text-white/85',
              ].join(' ')}
            >
              {s.label}
            </button>
            {i === 0 && <span className="text-white/25">◯</span>}
          </span>
        );
      })}
    </div>
  );
}
