import { beforeEach, describe, expect, it } from 'vitest';
import { useMetaStore } from '../store';

const RESET = () => {
  useMetaStore.setState({
    timeWindow: '24h',
    selectedCountry: null,
    selectedTokenId: null,
    hoveredTokenId: null,
    hoveredCountry: null,
    moonFilter: 'trending',
    chain: 'all',
    narrativeIds: [],
    liveEvents: [],
    narrativeEvents: [],
    simulatedTokens: [],
    muted: true,
  });
};

beforeEach(RESET);

describe('useMetaStore — filters', () => {
  it('toggleNarrativeId adds, then removes', () => {
    const { toggleNarrativeId } = useMetaStore.getState();
    toggleNarrativeId('us-eth-etf');
    expect(useMetaStore.getState().narrativeIds).toEqual(['us-eth-etf']);
    toggleNarrativeId('us-eth-etf');
    expect(useMetaStore.getState().narrativeIds).toEqual([]);
  });

  it('toggleNarrativeId preserves insertion order on multi-select', () => {
    const { toggleNarrativeId } = useMetaStore.getState();
    toggleNarrativeId('a');
    toggleNarrativeId('b');
    toggleNarrativeId('c');
    expect(useMetaStore.getState().narrativeIds).toEqual(['a', 'b', 'c']);
    toggleNarrativeId('b');
    expect(useMetaStore.getState().narrativeIds).toEqual(['a', 'c']);
  });

  it('clearAllFilters wipes chain + narratives + selections in one shot', () => {
    const s = useMetaStore.getState();
    s.setChain('solana');
    s.toggleNarrativeId('frog');
    s.setSelectedCountry('US');
    s.setSelectedToken('mock-pepe');
    s.clearAllFilters();
    const final = useMetaStore.getState();
    expect(final.chain).toBe('all');
    expect(final.narrativeIds).toEqual([]);
    expect(final.selectedCountry).toBeNull();
    expect(final.selectedTokenId).toBeNull();
  });

  it('time window changes don\'t touch other filter state', () => {
    const s = useMetaStore.getState();
    s.toggleNarrativeId('a');
    s.setChain('base');
    s.setTimeWindow('7d');
    const final = useMetaStore.getState();
    expect(final.timeWindow).toBe('7d');
    expect(final.narrativeIds).toEqual(['a']);
    expect(final.chain).toBe('base');
  });
});

describe('useMetaStore — capped event log', () => {
  it('pushNarrativeEvent keeps the newest, drops the 51st', () => {
    const { pushNarrativeEvent } = useMetaStore.getState();
    for (let i = 0; i < 60; i++) {
      pushNarrativeEvent({
        id: String(i),
        type: 'new-story',
        timestamp: i,
        country: 'US',
        narrativeId: 'n',
        title: `evt-${i}`,
        impact: 50,
        category: 'trending',
      });
    }
    const log = useMetaStore.getState().narrativeEvents;
    expect(log.length).toBe(50);
    // Newest event is at index 0.
    expect(log[0].id).toBe('59');
  });
});

describe('useMetaStore — toggleMuted', () => {
  it('flips muted', () => {
    expect(useMetaStore.getState().muted).toBe(true);
    useMetaStore.getState().toggleMuted();
    expect(useMetaStore.getState().muted).toBe(false);
    useMetaStore.getState().toggleMuted();
    expect(useMetaStore.getState().muted).toBe(true);
  });
});
