/**
 * VADER-lite sentiment scorer. Hand-curated lexicon with intensity values in
 * [-3, 3]; a token's score is summed across the tweet and rescaled to [-1, 1].
 * Handles a small set of negations + intensifiers. This is intentionally
 * smaller than full VADER (≈7K words) — good enough for directional signal,
 * cheap on cold-start, swappable later.
 */

const LEXICON: Record<string, number> = {
  // Strong positives
  amazing: 2.5,
  awesome: 2.5,
  excellent: 2.5,
  fantastic: 2.5,
  outstanding: 2.5,
  brilliant: 2.5,
  incredible: 2.5,
  // Positive
  good: 1.5,
  great: 2,
  happy: 1.8,
  love: 2.3,
  loved: 2.3,
  win: 1.8,
  winning: 2,
  rally: 1.6,
  surge: 1.6,
  surging: 1.6,
  bullish: 2,
  pump: 1.4,
  pumping: 1.5,
  moon: 1.5,
  mooning: 1.6,
  ath: 1.7,
  green: 1.0,
  approve: 1.2,
  approved: 1.5,
  approval: 1.4,
  pass: 1.0,
  passed: 1.2,
  upgrade: 1.4,
  upgraded: 1.5,
  beat: 1.5,
  beats: 1.5,
  record: 1.4,
  positive: 1.6,
  optimistic: 1.6,
  excited: 1.4,
  strong: 1.2,
  rebound: 1.2,
  recovery: 1.2,
  partnership: 1.0,
  launch: 1.0,
  launched: 1.1,
  ship: 0.8,
  shipped: 1.0,

  // Negative
  bad: -1.5,
  worse: -1.7,
  worst: -2.5,
  awful: -2.5,
  terrible: -2.5,
  horrible: -2.5,
  fail: -1.8,
  failed: -2,
  failure: -2,
  crash: -2.2,
  crashed: -2.2,
  crashing: -2.2,
  dump: -1.6,
  dumping: -1.7,
  rug: -2.5,
  rugged: -2.5,
  rugpull: -2.7,
  scam: -2.7,
  hack: -2.5,
  hacked: -2.5,
  exploit: -2.3,
  exploited: -2.3,
  breach: -2,
  bug: -1.0,
  bearish: -2,
  red: -1.0,
  drop: -1.2,
  drops: -1.2,
  dropped: -1.4,
  fall: -1.2,
  falling: -1.3,
  fell: -1.2,
  decline: -1.2,
  losses: -1.4,
  lose: -1.4,
  loser: -1.5,
  losing: -1.4,
  attack: -1.8,
  attacked: -1.8,
  ban: -1.7,
  banned: -1.8,
  reject: -1.4,
  rejected: -1.5,
  miss: -1.2,
  missed: -1.2,
  cut: -0.5, // ambiguous
  layoffs: -2,
  fired: -1.5,
  bankrupt: -2.5,
  bankruptcy: -2.5,
  fraud: -2.7,
  guilty: -2,
  jailed: -2,
  arrested: -1.8,
  worried: -1.4,
  fear: -1.6,
  panic: -2,
  weak: -1.2,
  poor: -1.2,
  negative: -1.5,
  pessimistic: -1.5,
};

const INTENSIFIERS = new Set([
  'very',
  'super',
  'extremely',
  'highly',
  'really',
  'absolutely',
  'massively',
]);
const DIMINISHERS = new Set([
  'slightly',
  'somewhat',
  'kinda',
  'sort',
  'mildly',
  'barely',
  'hardly',
]);
const NEGATIONS = new Set([
  'not',
  'no',
  'never',
  'cannot',
  "can't",
  "won't",
  "don't",
  "didn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "shouldn't",
  "couldn't",
  "wouldn't",
  'without',
  'lack',
  'lacks',
]);

const TOKEN_RE = /[a-zA-Z']+/g;

function tokenise(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_RE) ?? []) as string[];
}

/**
 * Score a single tweet/string. Returns a sentiment in [-1, 1].
 */
export function scoreText(text: string): number {
  const tokens = tokenise(text);
  if (tokens.length === 0) return 0;

  let total = 0;
  let hits = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const base = LEXICON[tok];
    if (base === undefined) continue;

    let multiplier = 1;
    // Look back up to 3 tokens for negations / intensifiers.
    const back = tokens.slice(Math.max(0, i - 3), i);
    if (back.some((b) => NEGATIONS.has(b))) multiplier *= -0.6;
    if (back.some((b) => INTENSIFIERS.has(b))) multiplier *= 1.4;
    if (back.some((b) => DIMINISHERS.has(b))) multiplier *= 0.6;

    total += base * multiplier;
    hits += 1;
  }

  if (hits === 0) return 0;
  // Rescale to roughly [-1, 1] — average raw score / max single-word weight.
  return Math.max(-1, Math.min(1, total / (hits * 2.5)));
}

/**
 * Mean sentiment across many texts. Handles empty input.
 */
export function meanSentiment(texts: string[]): number {
  if (texts.length === 0) return 0;
  let s = 0;
  for (const t of texts) s += scoreText(t);
  return s / texts.length;
}
