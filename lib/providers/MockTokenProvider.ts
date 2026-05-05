import type { TimeWindow } from '../types';
import type { HeatLevel, Token, TokenChain } from '../types/token';
import type { TokenProvider } from './TokenProvider';

/**
 * Deterministic mock token universe — same 80 tokens, same numbers, same
 * order every load. Critical for Phase D visual debugging. Real providers
 * (DexScreener, Birdeye) will return live data shaped to the same Token type.
 */

type Seed = {
  symbol: string;
  name: string;
  category: HeatLevel;
  marketCap: number;
  priceUsd: number;
  priceChange24h: number;
  /** Hours since launch. */
  age: number;
  chain: TokenChain;
  tags: string[];
  contractAddress?: string;
};

const HOUR = 1;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// 5 majors — large cap, slow-moving.
const MAJORS: Seed[] = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'warm', marketCap: 1.2e12, priceUsd: 110_000, priceChange24h: 2.3, age: 15 * YEAR, chain: 'other', tags: ['L1', 'store-of-value'] },
  { symbol: 'ETH', name: 'Ethereum', category: 'warm', marketCap: 410e9, priceUsd: 3500, priceChange24h: 3.1, age: 10 * YEAR, chain: 'ethereum', tags: ['L1', 'DeFi'] },
  { symbol: 'SOL', name: 'Solana', category: 'warm', marketCap: 80e9, priceUsd: 172, priceChange24h: 5.2, age: 5 * YEAR, chain: 'solana', tags: ['L1', 'meme', 'DeFi'] },
  { symbol: 'BNB', name: 'BNB', category: 'emerging', marketCap: 90e9, priceUsd: 620, priceChange24h: 0.8, age: 8 * YEAR, chain: 'other', tags: ['L1', 'DeFi'] },
  { symbol: 'XRP', name: 'XRP', category: 'emerging', marketCap: 35e9, priceUsd: 0.62, priceChange24h: 1.5, age: 12 * YEAR, chain: 'other', tags: ['L1', 'payments'] },
];

// 20 memecoins — 5 hot, 12 warm, 3 emerging.
const MEMECOINS: Seed[] = [
  { symbol: 'BONK', name: 'Bonk', category: 'hot', marketCap: 2e9, priceUsd: 0.000028, priceChange24h: 12, age: 8 * MONTH, chain: 'solana', tags: ['meme', 'dog'] },
  { symbol: 'WIF', name: 'dogwifhat', category: 'hot', marketCap: 4e9, priceUsd: 4.0, priceChange24h: 18, age: 9 * MONTH, chain: 'solana', tags: ['meme', 'dog'] },
  { symbol: 'PEPE', name: 'Pepe', category: 'hot', marketCap: 5e9, priceUsd: 0.0000118, priceChange24h: 9, age: 15 * MONTH, chain: 'ethereum', tags: ['meme', 'frog'] },
  { symbol: 'PNUT', name: 'Peanut the Squirrel', category: 'hot', marketCap: 1.5e9, priceUsd: 1.5, priceChange24h: 24, age: 6 * 7 * DAY, chain: 'solana', tags: ['meme', 'celebrity'] },
  { symbol: 'FART', name: 'Fartcoin', category: 'hot', marketCap: 800e6, priceUsd: 0.8, priceChange24h: 16, age: 2 * MONTH, chain: 'solana', tags: ['meme'] },
  { symbol: 'POPCAT', name: 'Popcat', category: 'warm', marketCap: 1.2e9, priceUsd: 1.2, priceChange24h: 14, age: 5 * MONTH, chain: 'solana', tags: ['meme', 'cat'] },
  { symbol: 'MOG', name: 'MOG', category: 'warm', marketCap: 600e6, priceUsd: 0.0000016, priceChange24h: 9, age: 7 * MONTH, chain: 'ethereum', tags: ['meme'] },
  { symbol: 'TURBO', name: 'Turbo', category: 'warm', marketCap: 400e6, priceUsd: 0.006, priceChange24h: 4, age: 8 * MONTH, chain: 'ethereum', tags: ['meme'] },
  { symbol: 'BRETT', name: 'Brett', category: 'warm', marketCap: 1.3e9, priceUsd: 0.13, priceChange24h: 7, age: 4 * MONTH, chain: 'base', tags: ['meme', 'frog'] },
  { symbol: 'MEW', name: "cat in a dogs world", category: 'warm', marketCap: 400e6, priceUsd: 0.0044, priceChange24h: 11, age: 4 * MONTH, chain: 'solana', tags: ['meme', 'cat'] },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'warm', marketCap: 30e9, priceUsd: 0.21, priceChange24h: 3, age: 10 * YEAR, chain: 'other', tags: ['meme', 'dog'] },
  { symbol: 'SHIB', name: 'Shiba Inu', category: 'warm', marketCap: 14e9, priceUsd: 0.0000235, priceChange24h: 2, age: 4 * YEAR, chain: 'ethereum', tags: ['meme', 'dog'] },
  { symbol: 'FLOKI', name: 'Floki', category: 'warm', marketCap: 2.5e9, priceUsd: 0.026, priceChange24h: 15, age: 3 * YEAR, chain: 'ethereum', tags: ['meme', 'dog'] },
  { symbol: 'CHILLGUY', name: 'Chill Guy', category: 'warm', marketCap: 300e6, priceUsd: 0.30, priceChange24h: 28, age: 1 * MONTH, chain: 'solana', tags: ['meme'] },
  { symbol: 'MOODENG', name: 'Moo Deng', category: 'warm', marketCap: 400e6, priceUsd: 0.40, priceChange24h: 12, age: 6 * 7 * DAY, chain: 'solana', tags: ['meme', 'celebrity'] },
  { symbol: 'TROLL', name: 'Troll', category: 'warm', marketCap: 90e6, priceUsd: 0.09, priceChange24h: 18, age: 4 * MONTH, chain: 'solana', tags: ['meme'] },
  { symbol: 'SLERF', name: 'Slerf', category: 'warm', marketCap: 250e6, priceUsd: 0.25, priceChange24h: 22, age: 5 * MONTH, chain: 'solana', tags: ['meme'] },
  { symbol: 'BABYDOGE', name: 'BabyDoge', category: 'emerging', marketCap: 200e6, priceUsd: 1.8e-9, priceChange24h: 5, age: 2 * YEAR, chain: 'other', tags: ['meme', 'dog'] },
  { symbol: 'ANALOS', name: 'Analos', category: 'emerging', marketCap: 80e6, priceUsd: 0.00045, priceChange24h: 20, age: 4 * MONTH, chain: 'solana', tags: ['meme'] },
  { symbol: 'BOME', name: 'Book of Meme', category: 'emerging', marketCap: 300e6, priceUsd: 0.005, priceChange24h: 6, age: 7 * MONTH, chain: 'solana', tags: ['meme'] },
];

// 30 mid-cap — 2 hot, 13 warm, 15 emerging.
const MID_CAP: Seed[] = [
  { symbol: 'TAO', name: 'Bittensor', category: 'hot', marketCap: 4e9, priceUsd: 580, priceChange24h: 18, age: 2 * YEAR, chain: 'other', tags: ['AI'] },
  { symbol: 'AGIX', name: 'SingularityNET', category: 'hot', marketCap: 800e6, priceUsd: 0.6, priceChange24h: 14, age: 5 * YEAR, chain: 'ethereum', tags: ['AI'] },
  { symbol: 'LINK', name: 'Chainlink', category: 'warm', marketCap: 14e9, priceUsd: 21, priceChange24h: 2, age: 8 * YEAR, chain: 'ethereum', tags: ['DeFi', 'RWA'] },
  { symbol: 'AVAX', name: 'Avalanche', category: 'warm', marketCap: 15e9, priceUsd: 36, priceChange24h: 4, age: 4 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'AAVE', name: 'Aave', category: 'warm', marketCap: 5e9, priceUsd: 320, priceChange24h: 6, age: 5 * YEAR, chain: 'ethereum', tags: ['DeFi'] },
  { symbol: 'ARB', name: 'Arbitrum', category: 'warm', marketCap: 4e9, priceUsd: 1.0, priceChange24h: 7, age: 2 * YEAR, chain: 'ethereum', tags: ['L2'] },
  { symbol: 'OP', name: 'Optimism', category: 'warm', marketCap: 2e9, priceUsd: 2.1, priceChange24h: 4, age: 3 * YEAR, chain: 'ethereum', tags: ['L2'] },
  { symbol: 'SEI', name: 'Sei', category: 'warm', marketCap: 1.5e9, priceUsd: 0.5, priceChange24h: 10, age: 1.5 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'INJ', name: 'Injective', category: 'warm', marketCap: 1.8e9, priceUsd: 22, priceChange24h: 12, age: 3 * YEAR, chain: 'other', tags: ['L1', 'DeFi'] },
  { symbol: 'RNDR', name: 'Render', category: 'warm', marketCap: 5e9, priceUsd: 8.5, priceChange24h: 8, age: 4 * YEAR, chain: 'ethereum', tags: ['AI', 'depin'] },
  { symbol: 'FET', name: 'Fetch.ai', category: 'warm', marketCap: 2e9, priceUsd: 1.6, priceChange24h: 6, age: 5 * YEAR, chain: 'ethereum', tags: ['AI'] },
  { symbol: 'SUI', name: 'Sui', category: 'warm', marketCap: 7e9, priceUsd: 2.4, priceChange24h: 3, age: 1.5 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'NEAR', name: 'Near', category: 'warm', marketCap: 4e9, priceUsd: 5.5, priceChange24h: 6, age: 4 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'KAS', name: 'Kaspa', category: 'warm', marketCap: 2.5e9, priceUsd: 0.12, priceChange24h: 5, age: 2 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'TON', name: 'Toncoin', category: 'warm', marketCap: 12e9, priceUsd: 5.5, priceChange24h: 2, age: 3 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'ADA', name: 'Cardano', category: 'emerging', marketCap: 35e9, priceUsd: 1.0, priceChange24h: 1, age: 7 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'DOT', name: 'Polkadot', category: 'emerging', marketCap: 9e9, priceUsd: 6.0, priceChange24h: 0.5, age: 5 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'UNI', name: 'Uniswap', category: 'emerging', marketCap: 9e9, priceUsd: 14, priceChange24h: 3, age: 4 * YEAR, chain: 'ethereum', tags: ['DeFi'] },
  { symbol: 'ATOM', name: 'Cosmos', category: 'emerging', marketCap: 3e9, priceUsd: 7.5, priceChange24h: 2, age: 6 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'LDO', name: 'Lido DAO', category: 'emerging', marketCap: 2e9, priceUsd: 2.3, priceChange24h: 5, age: 4 * YEAR, chain: 'ethereum', tags: ['DeFi'] },
  { symbol: 'TIA', name: 'Celestia', category: 'emerging', marketCap: 1.5e9, priceUsd: 5, priceChange24h: 5, age: 1 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'APT', name: 'Aptos', category: 'emerging', marketCap: 4e9, priceUsd: 9, priceChange24h: 2, age: 2 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'ICP', name: 'Internet Computer', category: 'emerging', marketCap: 4e9, priceUsd: 8, priceChange24h: 1, age: 4 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'FIL', name: 'Filecoin', category: 'emerging', marketCap: 2.5e9, priceUsd: 4.5, priceChange24h: 0.8, age: 4 * YEAR, chain: 'other', tags: ['depin'] },
  { symbol: 'HBAR', name: 'Hedera', category: 'emerging', marketCap: 4e9, priceUsd: 0.11, priceChange24h: 4, age: 5 * YEAR, chain: 'other', tags: ['L1'] },
  { symbol: 'VET', name: 'VeChain', category: 'emerging', marketCap: 2e9, priceUsd: 0.027, priceChange24h: 1, age: 5 * YEAR, chain: 'other', tags: ['L1', 'RWA'] },
  { symbol: 'THETA', name: 'Theta', category: 'emerging', marketCap: 1e9, priceUsd: 1, priceChange24h: 3, age: 5 * YEAR, chain: 'other', tags: ['gaming'] },
  { symbol: 'JUP', name: 'Jupiter', category: 'emerging', marketCap: 1.5e9, priceUsd: 1.1, priceChange24h: 4, age: 1.5 * YEAR, chain: 'solana', tags: ['DeFi'] },
  { symbol: 'PYTH', name: 'Pyth', category: 'emerging', marketCap: 1e9, priceUsd: 0.34, priceChange24h: 6, age: 1 * YEAR, chain: 'solana', tags: ['DeFi'] },
  { symbol: 'W', name: 'Wormhole', category: 'emerging', marketCap: 400e6, priceUsd: 0.20, priceChange24h: 3, age: 1 * YEAR, chain: 'other', tags: ['DeFi'] },
];

// 25 fresh launches — 3 hot, 2 warm, 20 emerging.
const FRESH: Seed[] = [
  { symbol: 'ROCKET', name: 'Rocket', category: 'hot', marketCap: 8e6, priceUsd: 0.008, priceChange24h: 250, age: 2, chain: 'solana', tags: ['meme'] },
  { symbol: 'AIDOG', name: 'AIDog', category: 'hot', marketCap: 2e6, priceUsd: 0.002, priceChange24h: 400, age: 1, chain: 'solana', tags: ['meme', 'AI', 'dog'] },
  { symbol: 'POPE', name: 'Popecoin', category: 'hot', marketCap: 1.5e6, priceUsd: 0.0015, priceChange24h: 320, age: 0.5, chain: 'solana', tags: ['meme', 'political'] },
  { symbol: 'GIGA', name: 'Gigachad', category: 'warm', marketCap: 90e6, priceUsd: 0.09, priceChange24h: 60, age: 18, chain: 'solana', tags: ['meme'] },
  { symbol: 'TRUMP', name: 'MAGA', category: 'warm', marketCap: 400e6, priceUsd: 4.0, priceChange24h: 25, age: 36, chain: 'ethereum', tags: ['political', 'celebrity'] },
  { symbol: 'MOON', name: 'Moonbeam', category: 'emerging', marketCap: 30e6, priceUsd: 0.04, priceChange24h: 120, age: 4, chain: 'solana', tags: ['meme'] },
  { symbol: 'GORK', name: 'Gork', category: 'emerging', marketCap: 5e6, priceUsd: 0.005, priceChange24h: 180, age: 6, chain: 'solana', tags: ['meme'] },
  { symbol: 'AGIX2', name: 'AGIX 2.0', category: 'emerging', marketCap: 4e6, priceUsd: 0.004, priceChange24h: 200, age: 8, chain: 'ethereum', tags: ['AI'] },
  { symbol: 'LMEME', name: 'LessMeme', category: 'emerging', marketCap: 600e3, priceUsd: 0.0006, priceChange24h: 500, age: 1, chain: 'solana', tags: ['meme'] },
  { symbol: 'HORSE', name: 'Horsey', category: 'emerging', marketCap: 3e6, priceUsd: 0.003, priceChange24h: 150, age: 5, chain: 'solana', tags: ['meme'] },
  { symbol: 'VIRGIN', name: 'Virgin', category: 'emerging', marketCap: 250e3, priceUsd: 0.00025, priceChange24h: 800, age: 0.3, chain: 'solana', tags: ['meme'] },
  { symbol: 'KAMALA', name: 'Kamala', category: 'emerging', marketCap: 30e6, priceUsd: 0.03, priceChange24h: 50, age: 12, chain: 'ethereum', tags: ['political', 'celebrity'] },
  { symbol: 'MOO', name: 'Moocoin', category: 'emerging', marketCap: 2e6, priceUsd: 0.002, priceChange24h: 110, age: 7, chain: 'solana', tags: ['meme'] },
  { symbol: 'BLAST', name: 'Blastoise', category: 'emerging', marketCap: 5e6, priceUsd: 0.005, priceChange24h: 90, age: 9, chain: 'ethereum', tags: ['gaming', 'meme'] },
  { symbol: 'CYBER', name: 'CyberDog', category: 'emerging', marketCap: 1e6, priceUsd: 0.001, priceChange24h: 280, age: 4, chain: 'solana', tags: ['meme', 'dog'] },
  { symbol: 'DEEP', name: 'Deep', category: 'emerging', marketCap: 300e3, priceUsd: 0.0003, priceChange24h: 600, age: 2, chain: 'solana', tags: ['meme'] },
  { symbol: 'SAGE', name: 'Sage', category: 'emerging', marketCap: 200e3, priceUsd: 0.0002, priceChange24h: 750, age: 1.5, chain: 'solana', tags: ['meme'] },
  { symbol: 'VITARO', name: 'Vitalik AI', category: 'emerging', marketCap: 80e3, priceUsd: 0.00008, priceChange24h: 1200, age: 0.8, chain: 'ethereum', tags: ['meme', 'celebrity', 'AI'] },
  { symbol: 'ZAP', name: 'Zapcoin', category: 'emerging', marketCap: 70e6, priceUsd: 0.07, priceChange24h: 40, age: 22, chain: 'solana', tags: ['meme'] },
  { symbol: 'VERA', name: 'Veracity', category: 'emerging', marketCap: 500e3, priceUsd: 0.0005, priceChange24h: 480, age: 3, chain: 'base', tags: ['meme'] },
  { symbol: 'ECHO', name: 'Echocoin', category: 'emerging', marketCap: 9e6, priceUsd: 0.009, priceChange24h: 75, age: 14, chain: 'solana', tags: ['meme'] },
  { symbol: 'LUMEN', name: 'Lumen', category: 'emerging', marketCap: 1.2e6, priceUsd: 0.0012, priceChange24h: 200, age: 6, chain: 'solana', tags: ['meme'] },
  { symbol: 'TYCHO', name: 'Tycho', category: 'emerging', marketCap: 2.5e6, priceUsd: 0.0025, priceChange24h: 130, age: 5, chain: 'solana', tags: ['meme'] },
  { symbol: 'MARE', name: 'Mare', category: 'emerging', marketCap: 800e3, priceUsd: 0.0008, priceChange24h: 320, age: 2, chain: 'solana', tags: ['meme'] },
  { symbol: 'ARTEMIS', name: 'Artemis', category: 'emerging', marketCap: 400e3, priceUsd: 0.0004, priceChange24h: 550, age: 1.2, chain: 'solana', tags: ['meme'] },
];

const ALL_SEEDS: Seed[] = [...MAJORS, ...MEMECOINS, ...MID_CAP, ...FRESH];

// Deterministic per-symbol fraction in [0, 1) — used to make volume ratios
// vary token-to-token without losing reproducibility.
function symbolFraction(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const BASE_VOL_RATIO: Record<HeatLevel, number> = {
  hot: 0.22,
  warm: 0.08,
  emerging: 0.04,
};

// Per-window scalar applied to the 24h base volume.
const WINDOW_VOL_SCALE: Record<TimeWindow, number> = {
  '1h': 1 / 24,
  '24h': 1,
  '7d': 7,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function seedToToken(seed: Seed, window: TimeWindow): Token {
  const variance = 0.7 + symbolFraction(seed.symbol) * 0.6; // 0.7..1.3
  const baseVolume24h = seed.marketCap * BASE_VOL_RATIO[seed.category] * variance;
  const volume = baseVolume24h * WINDOW_VOL_SCALE[window];

  // Map percent change to [-1, 1] with a soft compression so 1000% pumps
  // still cap at +1 cleanly.
  const momentum = clamp(seed.priceChange24h / 100, -1, 1);

  return {
    id: `mock-${seed.symbol.toLowerCase()}`,
    symbol: seed.symbol,
    name: seed.name,
    marketCap: seed.marketCap,
    volume24h: Math.round(volume),
    priceUsd: seed.priceUsd,
    priceChange24h: seed.priceChange24h,
    momentum,
    category: seed.category,
    narrativeTags: seed.tags,
    chain: seed.chain,
    age: seed.age,
    contractAddress: seed.contractAddress,
    source: 'mock',
  };
}

/**
 * Filter + sort the seed universe per window so the count and ordering
 * visibly change when the user toggles BREAKING NOW / 24H / 7D in the HUD.
 *
 *   BREAKING NOW (1h) — tokens with strong momentum (>0.6) or just-launched
 *                       (age <1h). Sorted by momentum desc.
 *   24H              — full set, sorted by 24h change desc.
 *   7D               — full set, sorted by 7d change. We don't have a 7d
 *                       column yet so we use 24h change as a proxy until
 *                       the real provider lands.
 */
function filterForWindow(tokens: Token[], window: TimeWindow): Token[] {
  if (window === '1h') {
    return tokens
      .filter((t) => t.momentum > 0.6 || t.age < 1)
      .sort((a, b) => b.momentum - a.momentum);
  }
  // 24h + 7d both sort by 24h change desc until real 7d data exists.
  return tokens.slice().sort((a, b) => b.priceChange24h - a.priceChange24h);
}

export class MockTokenProvider implements TokenProvider {
  readonly id = 'mock' as const;

  async fetch(window: TimeWindow): Promise<Token[]> {
    const all = ALL_SEEDS.map((seed) => seedToToken(seed, window));
    return filterForWindow(all, window);
  }
}
