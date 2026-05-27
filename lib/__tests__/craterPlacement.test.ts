import { describe, expect, it } from 'vitest';
import { getCraterPosition, hashString } from '../craterPlacement';
import type { Token } from '../types/token';

function makeToken(overrides: Partial<Token> = {}): Token {
  return {
    id: 't',
    symbol: 'TEST',
    name: 'Test Token',
    marketCap: 1_000_000,
    volume24h: 10_000,
    priceUsd: 1,
    priceChange24h: 0,
    momentum: 0,
    category: 'warm',
    narrativeTags: [],
    chain: 'solana',
    age: 12,
    source: 'mock',
    ...overrides,
  };
}

describe('getCraterPosition', () => {
  it('lands on the unit sphere for every age bucket', () => {
    for (const age of [0.5, 3, 12, 48, 100]) {
      const v = getCraterPosition(makeToken({ symbol: `T${age}`, age }));
      expect(v.length()).toBeCloseTo(1, 5);
    }
  });

  it('is deterministic per symbol (same symbol → same position)', () => {
    const a = getCraterPosition(makeToken({ symbol: 'PEPE', age: 6 }));
    const b = getCraterPosition(makeToken({ symbol: 'PEPE', age: 6 }));
    expect(a.x).toBeCloseTo(b.x, 6);
    expect(a.y).toBeCloseTo(b.y, 6);
    expect(a.z).toBeCloseTo(b.z, 6);
  });

  it('different symbols spread to different positions', () => {
    const a = getCraterPosition(makeToken({ symbol: 'AAA', age: 6 }));
    const b = getCraterPosition(makeToken({ symbol: 'ZZZ', age: 6 }));
    expect(a.distanceTo(b)).toBeGreaterThan(0.1);
  });

  it('clusters fresh launches (age < 1h) near the front pole', () => {
    const v = getCraterPosition(makeToken({ symbol: 'FRESH', age: 0.5 }));
    // Polar angle 0 → +Z. We sweep up to 0.4 rad for age<1, so the
    // z component should be near 1 (cos(0..0.4) ≈ 0.92..1.0).
    expect(v.z).toBeGreaterThan(0.9);
  });

  it('drifts to back hemisphere for age >> 24h', () => {
    const v = getCraterPosition(makeToken({ symbol: 'OLD', age: 200 }));
    expect(v.z).toBeLessThan(0);
  });

  it('mirrors lateral X for the losers filter', () => {
    const tok = makeToken({ symbol: 'BAGS', age: 6 });
    const normal = getCraterPosition(tok);
    const mirrored = getCraterPosition(tok, 'losers');
    expect(mirrored.x).toBeCloseTo(-normal.x, 6);
    expect(mirrored.y).toBeCloseTo(normal.y, 6);
    expect(mirrored.z).toBeCloseTo(normal.z, 6);
  });
});

describe('hashString', () => {
  it('returns a non-negative integer', () => {
    for (const s of ['pepe', 'doge', 'bonk', '']) {
      const h = hashString(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(h)).toBe(true);
    }
  });

  it('is deterministic', () => {
    expect(hashString('metamap')).toBe(hashString('metamap'));
  });
});
