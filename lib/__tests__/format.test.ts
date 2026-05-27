import { describe, expect, it } from 'vitest';
import { formatAge, formatPercent, formatUsd, shortAddress } from '../format';

describe('formatUsd', () => {
  it('attaches the K/M/B/T suffix at the right boundary', () => {
    expect(formatUsd(1.2e12)).toBe('$1.20T');
    expect(formatUsd(5e9)).toBe('$5.00B');
    expect(formatUsd(2.3e6)).toBe('$2.3M');
    expect(formatUsd(4.5e3)).toBe('$4.5K');
    expect(formatUsd(12.34)).toBe('$12.34');
  });

  it('falls through to scientific notation for sub-cent prices', () => {
    expect(formatUsd(0.0001)).toBe('$0.0001');
    expect(formatUsd(0.000_000_005)).toMatch(/^\$5\.00e-9$/);
  });

  it('returns em-dash for non-finite values', () => {
    expect(formatUsd(NaN)).toBe('—');
    expect(formatUsd(Infinity)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('prefixes the sign for positive values', () => {
    expect(formatPercent(12.34)).toBe('+12.3%');
    expect(formatPercent(-4.5)).toBe('-4.5%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('formatAge', () => {
  it('switches units across the boundaries', () => {
    expect(formatAge(0.5)).toBe('30m');
    expect(formatAge(2.5)).toBe('2.5h');
    expect(formatAge(15)).toBe('15h');
    expect(formatAge(48)).toBe('2d');
    expect(formatAge(24 * 60)).toBe('2mo');
    expect(formatAge(24 * 365 * 2)).toBe('2.0y');
  });

  it('returns em-dash for invalid input', () => {
    expect(formatAge(-1)).toBe('—');
    expect(formatAge(NaN)).toBe('—');
  });
});

describe('shortAddress', () => {
  it('truncates with the requested head/tail lengths', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    expect(shortAddress(addr)).toBe('0x12…5678');
    expect(shortAddress(addr, 6, 6)).toBe('0x1234…345678');
  });

  it('passes short addresses through unchanged', () => {
    expect(shortAddress('shortone')).toBe('shortone');
  });
});
