'use client';

import { create } from 'zustand';

export type Surface = 'earth' | 'moon';

export type TransitionPhase = 'idle' | 'fadeIn' | 'hold' | 'fadeOut';

type State = {
  phase: TransitionPhase;
  fromSurface: Surface | null;
  toSurface: Surface | null;
};

type Actions = {
  start: (from: Surface, to: Surface) => void;
  setPhase: (phase: TransitionPhase) => void;
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
 */
export const useSurfaceTransition = create<State & Actions>((set) => ({
  phase: 'idle',
  fromSurface: null,
  toSurface: null,
  start: (fromSurface, toSurface) =>
    set({ phase: 'fadeIn', fromSurface, toSurface }),
  setPhase: (phase) => set({ phase }),
}));
