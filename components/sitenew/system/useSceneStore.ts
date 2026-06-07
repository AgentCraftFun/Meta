'use client';

import { create } from 'zustand';

/**
 * Shared state for the /siteNEW experience. The scroll layer writes
 * `scrollProgress` + `activeSection`; the scene reads them to fly the camera
 * and ignite beacons. `reducedMotion` is the first-class accessibility path;
 * `booted` gates the hero power-on sequence.
 */
export type SceneState = {
  /** Normalized whole-document scroll progress, 0→1. */
  scrollProgress: number;
  /** Index of the section currently in view, 0→7. */
  activeSection: number;
  /** Local scroll progress 0→1 within the active section. */
  sectionProgress: number;
  /** Continuous travel position (0→7, damped) — drives scroll-linked globe spin. */
  globeTravel: number;
  /** Instantaneous scroll velocity (px/frame-ish) for the fast-scroll guard. */
  scrollVelocity: number;
  /** OS prefers-reduced-motion — set once on mount. */
  reducedMotion: boolean;
  /** Boot sequence finished (or skipped). */
  booted: boolean;

  setScrollProgress: (p: number) => void;
  setActiveSection: (i: number) => void;
  setSectionProgress: (p: number) => void;
  setGlobeTravel: (v: number) => void;
  setScrollVelocity: (v: number) => void;
  setReducedMotion: (v: boolean) => void;
  setBooted: (v: boolean) => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  scrollProgress: 0,
  activeSection: 0,
  sectionProgress: 0,
  globeTravel: 0,
  scrollVelocity: 0,
  reducedMotion: false,
  booted: false,

  setScrollProgress: (p) => set({ scrollProgress: p }),
  setActiveSection: (i) => set({ activeSection: i }),
  setSectionProgress: (p) => set({ sectionProgress: p }),
  setGlobeTravel: (v) => set({ globeTravel: v }),
  setScrollVelocity: (v) => set({ scrollVelocity: v }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setBooted: (v) => set({ booted: v }),
}));
