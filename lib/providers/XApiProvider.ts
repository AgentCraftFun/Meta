import type { Narrative, TimeWindow } from '../types';
import type { NarrativeProvider } from './NarrativeProvider';

/**
 * Real X API v2 implementation lands in Phase 6. For now this stub falls back
 * to MockProvider when invoked so a misconfigured `NARRATIVE_SOURCE=x` doesn't
 * blank the globe.
 */
export class XApiProvider implements NarrativeProvider {
  readonly id = 'x' as const;

  async fetch(_window: TimeWindow): Promise<Narrative[]> {
    // Phase 6:
    //   - resolve top ~30 priority countries (WOEID + lat/lng)
    //   - hit X v2 trends-by-WOEID + recent search
    //   - cluster by entities/hashtags, score by tweet count + unique authors
    //   - compute volume / sentiment (VADER) / momentum (current vs 6h trail)
    //   - categorise breaking/trending/emerging and return top 10 / country
    return [];
  }
}
