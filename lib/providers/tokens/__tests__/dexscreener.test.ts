import { describe, expect, it, vi } from 'vitest';
import fixture from '../__fixtures__/tokens-sample.json';
import { applyFilter, pairToToken } from '../dexscreener';
import { TokenBucket } from '../rateLimiter';

/**
 * These tests exercise the pure functions in the DexScreener provider:
 *   - pairToToken: response → Token mapping
 *   - applyFilter: ranking + window-aware sort
 *   - TokenBucket: token-bucket queueing semantics
 *
 * The fixture is a real DexScreener `/latest/dex/tokens/{addresses}`
 * payload captured at build time so the schema stays in sync with the
 * production API surface.
 */

type Fixture = { pairs: Parameters<typeof pairToToken>[0][] };
const PAIRS = (fixture as Fixture).pairs;

describe('pairToToken', () => {
  it('maps a DexScreener pair into a Token', () => {
    const pair = PAIRS.find(
      (p) => p.baseToken.symbol === 'PEPE' && p.chainId === 'ethereum'
    );
    if (!pair) throw new Error('fixture must include a PEPE pair on ethereum');

    const token = pairToToken(pair);

    expect(token.symbol).toBe('PEPE');
    expect(token.chain).toBe('ethereum');
    expect(token.source).toBe('dexscreener');
    expect(token.id).toContain('dex-ethereum-');
    expect(token.priceUsd).toBeGreaterThan(0);
    expect(token.pairAddress).toBe(pair.pairAddress);
    expect(token.dexId).toBe(pair.dexId);
    // Fields lifted from the DexScreener response should round-trip.
    expect(token.fdv).toBe(pair.fdv);
    expect(token.liquidityUsd).toBe(pair.liquidity?.usd);
    expect(token.priceChange24h).toBe(pair.priceChange?.h24 ?? 0);
  });

  it('maps unknown chainIds to "other" so unsupported chains don\'t break the moon', () => {
    const exotic = PAIRS.find(
      (p) => p.chainId !== 'solana' && p.chainId !== 'ethereum' && p.chainId !== 'base'
    );
    if (!exotic) throw new Error('fixture must include at least one off-chain pair');

    const token = pairToToken(exotic);
    expect(token.chain).toBe('other');
  });

  it('does not produce NaN when DexScreener omits fields', () => {
    const sparse: Parameters<typeof pairToToken>[0] = {
      chainId: 'solana',
      dexId: 'raydium',
      pairAddress: 'PairSparse',
      baseToken: {
        address: 'AddrSparse',
        name: 'Sparse',
        symbol: 'SPRS',
      },
      quoteToken: { address: 'Quote', name: 'Quote', symbol: 'Q' },
      // No priceUsd / volume / priceChange / liquidity / fdv / pairCreatedAt
    };

    const token = pairToToken(sparse);

    expect(Number.isFinite(token.priceUsd)).toBe(true);
    expect(Number.isFinite(token.volume24h)).toBe(true);
    expect(Number.isFinite(token.priceChange24h)).toBe(true);
    expect(Number.isFinite(token.momentum)).toBe(true);
    expect(Number.isFinite(token.marketCap)).toBe(true);
    expect(Number.isFinite(token.age)).toBe(true);
  });

  it('soft-clips momentum into [-1, 1] for extreme pumps', () => {
    const moonshot: Parameters<typeof pairToToken>[0] = {
      chainId: 'solana',
      dexId: 'raydium',
      pairAddress: 'PairMoonshot',
      baseToken: {
        address: 'AddrMoonshot',
        name: 'Moonshot',
        symbol: 'MOON',
      },
      quoteToken: { address: 'Quote', name: 'Quote', symbol: 'Q' },
      priceUsd: '0.001',
      priceChange: { h24: 10_000, h1: 900 },
      volume: { h24: 5_000_000 },
      pairCreatedAt: Date.now() - 60 * 60 * 1000,
    };
    const token = pairToToken(moonshot);
    expect(token.momentum).toBeLessThanOrEqual(1);
    expect(token.momentum).toBeGreaterThanOrEqual(-1);
    expect(token.category).toBe('hot');
  });
});

describe('applyFilter', () => {
  const tokens = PAIRS.map(pairToToken);

  it('returns trending sorted by activity desc', () => {
    const out = applyFilter(tokens, 'trending', '24h', 5);
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(5);
    // First entry should not be lower-activity than the last; the
    // composite activity score makes a hard equality check brittle so
    // we just assert monotonic.
    for (let i = 0; i < out.length - 1; i++) {
      const a = out[i];
      const b = out[i + 1];
      // Using volume24h as a quick monotonic proxy when activity ties.
      expect(b.volume24h).toBeLessThanOrEqual(a.volume24h + 1e-6);
    }
  });

  it('returns gainers sorted by 24h change desc', () => {
    const out = applyFilter(tokens, 'gainers', '24h', 10);
    for (let i = 0; i < out.length - 1; i++) {
      expect(out[i].priceChange24h).toBeGreaterThanOrEqual(
        out[i + 1].priceChange24h
      );
    }
  });

  it('returns losers sorted by 24h change asc', () => {
    const out = applyFilter(tokens, 'losers', '24h', 10);
    for (let i = 0; i < out.length - 1; i++) {
      expect(out[i].priceChange24h).toBeLessThanOrEqual(
        out[i + 1].priceChange24h
      );
    }
  });

  it('uses 1h change when window=1h', () => {
    const out = applyFilter(tokens, 'gainers', '1h', 5);
    for (let i = 0; i < out.length - 1; i++) {
      const a = out[i].priceChange1h ?? out[i].priceChange24h;
      const b = out[i + 1].priceChange1h ?? out[i + 1].priceChange24h;
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it('honors limit', () => {
    expect(applyFilter(tokens, 'trending', '24h', 3).length).toBe(3);
    expect(applyFilter(tokens, 'trending', '24h', 0).length).toBe(0);
  });
});

describe('TokenBucket', () => {
  it('serves an immediate token when capacity is available', async () => {
    const b = new TokenBucket('test-fast', 5, 5);
    const t0 = Date.now();
    await b.acquire();
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(50);
    expect(b.available()).toBeGreaterThanOrEqual(3.9);
    expect(b.available()).toBeLessThanOrEqual(4.1);
  });

  it('queues when empty and logs at least once', async () => {
    const b = new TokenBucket('test-queue', 1, 50); // refills 50/sec → 20ms wait
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Drain the bucket.
    await b.acquire();
    expect(b.available()).toBeLessThan(1);

    const t0 = Date.now();
    await b.acquire();
    const elapsed = Date.now() - t0;

    // Should have waited at least one refill cycle.
    expect(elapsed).toBeGreaterThanOrEqual(15);
    expect(logSpy).toHaveBeenCalled();
    const queuedCall = logSpy.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('bucket empty')
    );
    expect(queuedCall).toBeDefined();

    logSpy.mockRestore();
  });
});

