'use client';

import { useEffect } from 'react';
import { useMetaStore } from './store';
import { useSurfaceTransition } from './useSurfaceTransition';

/**
 * Apply the cinematic transition's carryover payload during the
 * 'hold' phase so the user lands on a pre-filtered surface.
 *
 *   surface='moon'  — set narrativeIds from carryover.narrativeId so
 *                     the Moon's craters arrive scoped to that narrative.
 *   surface='earth' — pre-select carryover.countryISO and the
 *                     corresponding narrative so the Earth camera flies
 *                     to the token's home country.
 *
 * Carryover is NOT cleared here — the CanvasFilterChips overlay reads
 * it for the "From: <Narrative>" chip. The user clears it explicitly
 * by clicking the chip's × button.
 */
export function useCarryoverHandoff(surface: 'earth' | 'moon') {
  const phase = useSurfaceTransition((s) => s.phase);
  const carryover = useSurfaceTransition((s) => s.carryover);
  const setNarrativeIds = useMetaStore((s) => s.setNarrativeIds);
  const setSelectedCountry = useMetaStore((s) => s.setSelectedCountry);
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);

  useEffect(() => {
    if (phase !== 'hold' || !carryover) return;
    if (surface === 'moon' && carryover.narrativeId) {
      setNarrativeIds([carryover.narrativeId]);
      if (carryover.tokenId) setSelectedToken(carryover.tokenId);
    }
    if (surface === 'earth' && carryover.countryISO) {
      setSelectedCountry(carryover.countryISO);
      if (carryover.narrativeId) {
        setNarrativeIds([carryover.narrativeId]);
      }
    }
  }, [phase, carryover, surface, setNarrativeIds, setSelectedCountry, setSelectedToken]);
}
