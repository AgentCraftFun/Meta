export type TimeWindow = '1h' | '24h' | '7d';

export type NarrativeCategory = 'breaking' | 'trending' | 'emerging';

export type NarrativeSource = {
  url: string;
  author: string;
  text: string;
};

export type Narrative = {
  id: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  title: string;
  summary: string;
  /** 0–100 normalised volume */
  volume: number;
  /** -1 to 1 */
  sentiment: number;
  /** -1 to 1 */
  momentum: number;
  rank: number;
  category: NarrativeCategory;
  sources: NarrativeSource[];
  firstSeen: string;
  lastUpdated: string;
  timeWindow: TimeWindow;
};

export type SourceMode = 'mock' | 'x';

export type NarrativeQuery = {
  window: TimeWindow;
};
