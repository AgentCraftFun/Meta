import { describe, expect, it } from 'vitest';
import type { Narrative } from '../../types';
import type { Token } from '../../types/token';
import {
  inverseLink,
  narrativeToTag,
  tagToken,
  tagTokens,
} from '../rules';

function makeNarrative(overrides: Partial<Narrative> = {}): Narrative {
  return {
    id: 'us-trump-meta',
    country: 'US',
    title: 'Trump-meta cohort rotates higher',
    summary: 'Political memecoins coordinated bid.',
    volume: 70,
    sentiment: 0.2,
    momentum: 0.7,
    rank: 1,
    category: 'breaking',
    sources: [],
    firstSeen: new Date(0).toISOString(),
    lastUpdated: new Date().toISOString(),
    timeWindow: '1h',
    keywords: ['trump', 'djt', 'maga', 'kamala'],
    themes: ['politics', 'memes'],
    tagLabel: 'Trump-meta',
    relatedTokenIds: [],
    ...overrides,
  };
}

function makeToken(overrides: Partial<Token> = {}): Token {
  return {
    id: 'mock-trump',
    symbol: 'TRUMP',
    name: 'MAGA',
    marketCap: 400_000_000,
    volume24h: 50_000_000,
    priceUsd: 4,
    priceChange24h: 25,
    momentum: 0.5,
    category: 'warm',
    narrativeTags: [],
    chain: 'ethereum',
    age: 36,
    source: 'mock',
    ...overrides,
  };
}

describe('tagToken', () => {
  it('tags a token when its symbol matches a keyword (case-insensitive)', () => {
    const tags = tagToken(makeToken(), [makeNarrative()]);
    expect(tags).toHaveLength(1);
    expect(tags[0].id).toBe('us-trump-meta');
    expect(tags[0].label).toBe('Trump-meta');
  });

  it('tags via the token name when the symbol misses', () => {
    const tags = tagToken(
      makeToken({ symbol: 'XYZ', name: 'MAGA Doge' }),
      [makeNarrative()]
    );
    expect(tags.map((t) => t.id)).toContain('us-trump-meta');
  });

  it('only matches whole words — substring near-misses are rejected', () => {
    // 'tao' as a keyword should NOT match 'taos' or 'tactical' etc.
    const tao = makeNarrative({
      id: 'global-ai-tokens',
      tagLabel: 'AI tokens',
      keywords: ['tao'],
      themes: ['ai'],
    });
    expect(
      tagToken(makeToken({ symbol: 'TAOS', name: 'Taoshi' }), [tao])
    ).toHaveLength(0);
    expect(
      tagToken(makeToken({ symbol: 'TAO', name: 'Bittensor' }), [tao])
    ).toHaveLength(1);
  });

  it('handles regex special characters in keywords without throwing', () => {
    const weird = makeNarrative({
      id: 'edge-case',
      tagLabel: 'Edge',
      keywords: ['$pepe', 'a.b', 'c*d', '(e)'],
      themes: [],
    });
    expect(() => tagToken(makeToken(), [weird])).not.toThrow();
  });

  it('emits multiple tags when multiple narratives match', () => {
    const trump = makeNarrative();
    const politics = makeNarrative({
      id: 'global-political-memes',
      tagLabel: 'Political memes',
      keywords: ['trump', 'biden'],
      themes: ['politics'],
    });
    const tags = tagToken(makeToken(), [trump, politics]);
    expect(tags.map((t) => t.id).sort()).toEqual(
      ['global-political-memes', 'us-trump-meta'].sort()
    );
  });

  it('returns an empty array when nothing matches', () => {
    const tags = tagToken(
      makeToken({ symbol: 'ABC', name: 'Random Asset' }),
      [makeNarrative()]
    );
    expect(tags).toHaveLength(0);
  });
});

describe('tagTokens (batch)', () => {
  it('builds NarrativeTag objects with deterministic colorHash', () => {
    const out = tagTokens([makeToken()], [makeNarrative()]);
    expect(out[0].narrativeTags[0].colorHash).toBeGreaterThanOrEqual(0);
    expect(out[0].narrativeTags[0].colorHash).toBeLessThan(10);
    expect(out[0].narrativeTags[0].colorHash).toBe(
      tagTokens([makeToken()], [makeNarrative()])[0].narrativeTags[0].colorHash
    );
  });

  it('does not mutate inputs', () => {
    const tokens = [makeToken()];
    const narratives = [makeNarrative()];
    tagTokens(tokens, narratives);
    expect(tokens[0].narrativeTags).toEqual([]);
  });
});

describe('inverseLink', () => {
  it('populates relatedTokenIds from already-tagged tokens', () => {
    const narratives = [makeNarrative()];
    const tagged = tagTokens(
      [makeToken({ id: 'mock-trump' }), makeToken({ id: 'mock-2', symbol: 'KAMALA' })],
      narratives
    );
    const linked = inverseLink(narratives, tagged);
    expect(linked[0].relatedTokenIds.sort()).toEqual(['mock-2', 'mock-trump']);
  });

  it('returns empty relatedTokenIds when nothing matched', () => {
    const linked = inverseLink([makeNarrative()], []);
    expect(linked[0].relatedTokenIds).toEqual([]);
  });
});

describe('narrativeToTag', () => {
  it('derives label from tagLabel when present, falls back to title', () => {
    const withLabel = makeNarrative({ tagLabel: 'Custom' });
    expect(narrativeToTag(withLabel).label).toBe('Custom');

    const withoutLabel = makeNarrative({ tagLabel: '' });
    expect(narrativeToTag(withoutLabel).label).toBe(
      withoutLabel.title.slice(0, 40)
    );
  });

  it('carries country and themes through', () => {
    const n = makeNarrative({
      country: 'DE',
      themes: ['regulation', 'eu'],
    });
    const tag = narrativeToTag(n);
    expect(tag.countryISO).toBe('DE');
    expect(tag.themes).toEqual(['regulation', 'eu']);
  });
});
