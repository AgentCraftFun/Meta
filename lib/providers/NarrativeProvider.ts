import type { Narrative, TimeWindow } from '../types';

export interface NarrativeProvider {
  /** Stable id, e.g. 'mock' or 'x' — surfaced in the dev badge. */
  readonly id: 'mock' | 'x';
  /** Returns the ranked narrative set for a given time window. */
  fetch(window: TimeWindow): Promise<Narrative[]>;
}
