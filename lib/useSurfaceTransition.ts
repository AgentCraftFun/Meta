'use client';

import { create } from 'zustand';

export type Surface = 'earth' | 'moon';

export type TransitionPhase = 'idle' | 'fadeIn' | 'hold' | 'fadeOut';

/** Optional carryover payload — the narrative or token selection that
 *  should be pre-applied on the OTHER surface when the transition
 *  completes. Honoured during the 'hold' phase by useSurfaceTransition
 *  consumers so the user lands on a filtered surface, not a blank one. */
export type Carryover = {
  /** Narrative id to filter the Moon by when Earth → Moon. */
  narrativeId?: string;
  /** Narrative human label for the "From: X" chip on the Moon. */
  narrativeLabel?: string;
  /** Country ISO to fly Earth's camera to when Moon → Earth. */
  countryISO?: string;
  /** Token id to keep selected after the transition (used by the
   *  Moon's auto-orient camera). */
  tokenId?: string;
};

type State = {
  phase: TransitionPhase;
  fromSurface: Surface | null;
  toSurface: Surface | null;
  carryover: Carryover | null;
};

type Actions = {
  start: (from: Surface, to: Surface, carryover?: Carryover) => void;
  setPhase: (phase: TransitionPhase) => void;
  clearCarryover: () => void;
};

/**
 * Cross-surface transition state. Drives the black-overlay flow when the
 * user clicks the EARTH ◯ MOON nav so the route swap happens behind a
 * fade-to-black with a brief tactical readout.
 *
 *   idle   → fadeIn (overlay mounts, opacity 0 → 1 over 400ms)
 *           → hold   (router.push fires; "TRANSITIONING / X → Y" shows for 200ms)
 *           → fadeOut (overlay unmounts, opacity 1 → 0 over 600ms)
 *           → idle
 *
 * The optional `carryover` payload is dispatched by the canvas pages
 * when the transition starts. The destination page reads it during
 * 'hold' to pre-set its filters, then calls clearCarryover() so the
 * payload doesn't leak into the next transition.
 */
export const useSurfaceTransition = create<State & Actions>((set) => ({
  phase: 'idle',
  fromSurface: null,
  toSurface: null,
  carryover: null,
  start: (fromSurface, toSurface, carryover) =>
    set({
      phase: 'fadeIn',
      fromSurface,
      toSurface,
      carryover: carryover ?? null,
    }),
  setPhase: (phase) => set({ phase }),
  clearCarryover: () => set({ carryover: null }),
}));
