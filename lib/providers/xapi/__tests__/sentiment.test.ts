import { describe, expect, it } from 'vitest';
import { meanSentiment, scoreText } from '../sentiment';

describe('scoreText', () => {
  it('returns 0 for empty and zero-signal input', () => {
    expect(scoreText('')).toBe(0);
    expect(scoreText('the the the')).toBe(0);
  });

  it('detects bullish crypto vocab', () => {
    expect(scoreText('PEPE is absolutely mooning')).toBeGreaterThan(0.3);
    expect(scoreText('bullish ATH incoming')).toBeGreaterThan(0.3);
  });

  it('detects bearish crypto vocab', () => {
    expect(scoreText('rugpull confirmed, scam')).toBeLessThan(-0.3);
    expect(scoreText('crashing hard, exploit on the pool')).toBeLessThan(-0.3);
  });

  it('flips polarity with negation', () => {
    const positive = scoreText('this is great');
    const negated = scoreText('this is not great');
    expect(positive).toBeGreaterThan(0);
    expect(negated).toBeLessThan(positive);
  });

  it('clamps within [-1, 1]', () => {
    const piled = scoreText('amazing fantastic brilliant outstanding incredible');
    expect(piled).toBeGreaterThanOrEqual(-1);
    expect(piled).toBeLessThanOrEqual(1);
    const dumped = scoreText('crash rug scam hack exploit fraud');
    expect(dumped).toBeGreaterThanOrEqual(-1);
    expect(dumped).toBeLessThanOrEqual(1);
  });
});

describe('meanSentiment', () => {
  it('averages across a batch of tweets', () => {
    const score = meanSentiment([
      'love this token, bullish',
      'meh, neutral take',
      'crashing, bearish',
    ]);
    expect(Math.abs(score)).toBeLessThan(0.5);
  });

  it('returns 0 for empty input', () => {
    expect(meanSentiment([])).toBe(0);
  });
});
