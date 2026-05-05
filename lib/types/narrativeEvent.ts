export type NarrativeEventType =
  /** A narrative just emerged in a country. */
  | 'new-story'
  /** Existing narrative jumped >15% in impact score. */
  | 'momentum-shift'
  /** Same narrative now trending in 3+ countries. */
  | 'cross-country';

export type NarrativeEvent = {
  id: string;
  type: NarrativeEventType;
  /** Wall-clock ms when this event was generated. */
  timestamp: number;
  /** Country ISO code primarily attached to this event. */
  country: string;
  narrativeId: string;
  title: string;
  /** 0–100 impact score at the moment of the event. */
  impact: number;
  category: 'breaking' | 'trending' | 'emerging';
  /** For cross-country events, the additional country codes the narrative
   *  is now trending in (excluding the primary `country`). */
  relatedCountries?: string[];
};
