import type {
  Narrative,
  NarrativeCategory,
  NarrativeSource,
  TimeWindow,
} from '../types';
import type { NarrativeProvider } from './NarrativeProvider';

type Seed = {
  id: string;
  country: string;
  title: string;
  summary: string;
  volume: number;
  sentiment: number;
  momentum: number;
  category: NarrativeCategory;
  ageMinutes: number;
  sources: NarrativeSource[];
};

/**
 * Per-narrative link metadata. Kept in a side map so the 32 seed
 * literals above stay readable; merged into the Narrative object inside
 * shapeForWindow(). Keywords are deliberately broad — the rules tagger
 * matches word-boundary case-insensitive, so we want to catch ticker
 * variants and theme words that show up in random DEX-promoted token
 * names (e.g. 'pepe', 'doge', 'cat', 'pump').
 */
type SeedTag = {
  keywords: string[];
  themes: string[];
  tagLabel: string;
};

const SEED_TAG: Record<string, SeedTag> = {
  'us-eth-etf': {
    keywords: ['eth', 'ether', 'ethereum', 'etf', 'etha', 'blackrock'],
    themes: ['etf', 'institutional', 'eth'],
    tagLabel: 'ETH ETF',
  },
  'us-fomc-leak': {
    keywords: ['fomc', 'fed', 'powell', 'rate', 'rates', 'dotplot'],
    themes: ['macro', 'rates'],
    tagLabel: 'Fed / FOMC',
  },
  'us-nvidia-earnings': {
    keywords: ['nvda', 'nvidia', 'gpu', 'earnings'],
    themes: ['equities', 'ai'],
    tagLabel: 'NVDA earnings',
  },
  'cn-pboc-rrr': {
    keywords: ['pboc', 'rrr', 'china', 'yuan', 'cny'],
    themes: ['macro', 'china'],
    tagLabel: 'PBOC RRR',
  },
  'cn-deepseek-v4': {
    keywords: ['deepseek', 'llm', 'ai', 'gpt', 'multimodal'],
    themes: ['ai', 'china'],
    tagLabel: 'DeepSeek v4',
  },
  'jp-yen-intervention': {
    keywords: ['yen', 'jpy', 'usdjpy', 'mof', 'kanda', 'boj'],
    themes: ['fx', 'macro'],
    tagLabel: 'Yen FX',
  },
  'jp-sony-ai-chip': {
    keywords: ['sony', 'imx', 'robotics', 'chip', 'edge'],
    themes: ['ai', 'hardware'],
    tagLabel: 'Sony AI chip',
  },
  'kr-upbit-listing': {
    keywords: ['upbit', 'krw', 'korea', 'listing'],
    themes: ['exchange', 'listings'],
    tagLabel: 'Upbit listing',
  },
  'kr-samsung-hbm': {
    keywords: ['samsung', 'hbm', 'hbm4', 'nvidia'],
    themes: ['ai', 'hardware'],
    tagLabel: 'Samsung HBM',
  },
  'gb-fca-stable': {
    keywords: ['fca', 'gbp', 'stable', 'stablecoin', 'sterling'],
    themes: ['regulation', 'stablecoins'],
    tagLabel: 'FCA stables',
  },
  'gb-arm-takeover': {
    keywords: ['arm', 'silicon', 'inference', 'accelerator'],
    themes: ['ai', 'hardware'],
    tagLabel: 'Arm M&A',
  },
  'de-bafin-pump': {
    keywords: ['memecoin', 'meme', 'pump', 'shill', 'bafin', 'pumpfun'],
    themes: ['memes', 'regulation'],
    tagLabel: 'BaFin memecoins',
  },
  'de-vw-ev-deal': {
    keywords: ['vw', 'volkswagen', 'rivian', 'ev', 'van'],
    themes: ['equities', 'ev'],
    tagLabel: 'VW × Rivian',
  },
  'fr-ai-act-impl': {
    keywords: ['cnil', 'ai', 'gpai', 'redteam'],
    themes: ['ai', 'regulation'],
    tagLabel: 'EU AI Act',
  },
  'ae-vara-license': {
    keywords: ['vara', 'dubai', 'vasp', 'license'],
    themes: ['regulation', 'mena'],
    tagLabel: 'VARA license',
  },
  'ae-adq-ai': {
    keywords: ['adq', 'g42', 'compute', 'gpu', 'arabic'],
    themes: ['ai', 'mena'],
    tagLabel: 'ADQ AI fund',
  },
  'in-rbi-cbdc': {
    keywords: ['rbi', 'rupee', 'cbdc', 'erupee', 'india'],
    themes: ['cbdc', 'india'],
    tagLabel: 'Digital rupee',
  },
  'in-zomato-blink': {
    keywords: ['zomato', 'blinkit', 'nse', 'ipo'],
    themes: ['equities', 'india'],
    tagLabel: 'Blinkit spin',
  },
  'sg-mas-tokenize': {
    keywords: ['mas', 'tokenized', 'guardian', 'singapore'],
    themes: ['tokenization', 'asia'],
    tagLabel: 'MAS Guardian',
  },
  'hk-spot-eth-etf': {
    keywords: ['eth', 'ether', 'ethereum', 'etf', 'staking'],
    themes: ['etf', 'asia'],
    tagLabel: 'HK ETH ETF',
  },
  'au-asx-block': {
    keywords: ['asx', 'chess', 'dlt', 'settlement'],
    themes: ['tokenization', 'apac'],
    tagLabel: 'ASX DLT',
  },
  'br-pix-stable': {
    keywords: ['pix', 'usdc', 'brl', 'bcb', 'brazil'],
    themes: ['stablecoins', 'payments'],
    tagLabel: 'PIX stables',
  },
  'br-petr-buyback': {
    keywords: ['petrobras', 'buyback', 'brazil'],
    themes: ['equities', 'energy'],
    tagLabel: 'Petrobras BB',
  },
  'ar-milei-dolar': {
    keywords: ['milei', 'argentina', 'peso', 'dolar', 'usd', 'libra'],
    themes: ['politics', 'macro'],
    tagLabel: 'Argentina USD',
  },
  'mx-banxico-hold': {
    keywords: ['banxico', 'peso', 'mxn', 'mexico'],
    themes: ['macro', 'rates'],
    tagLabel: 'Banxico hold',
  },
  'ru-mining-tax': {
    keywords: ['mining', 'russia', 'duma', 'tariff'],
    themes: ['mining', 'regulation'],
    tagLabel: 'RU mining tax',
  },
  'tr-cbrt-rate': {
    keywords: ['cbrt', 'turkey', 'lira', 'try'],
    themes: ['macro', 'rates'],
    tagLabel: 'CBRT hike',
  },
  'ng-binance-suit': {
    keywords: ['binance', 'gambaryan', 'nigeria', 'exchange'],
    themes: ['exchange', 'regulation'],
    tagLabel: 'Binance NG',
  },
  'za-rand-bond': {
    keywords: ['sarb', 'rand', 'zar', 'south africa'],
    themes: ['macro', 'rates'],
    tagLabel: 'SARB cuts',
  },
  'ca-boc-cut': {
    keywords: ['boc', 'macklem', 'cad', 'canada'],
    themes: ['macro', 'rates'],
    tagLabel: 'BoC cut',
  },
  'ca-shopify-ai': {
    keywords: ['shopify', 'sidekick', 'ai', 'storefront'],
    themes: ['ai', 'equities'],
    tagLabel: 'Shopify AI',
  },
  'ch-finma-stake': {
    keywords: ['finma', 'staking', 'validator', 'custody'],
    themes: ['staking', 'regulation'],
    tagLabel: 'FINMA staking',
  },
  'nl-asml-litho': {
    keywords: ['asml', 'euv', 'litho', 'highna'],
    themes: ['ai', 'hardware'],
    tagLabel: 'ASML EUV',
  },
  'it-bitpanda-eu': {
    keywords: ['bitpanda', 'emi', 'mica', 'italy'],
    themes: ['exchange', 'regulation'],
    tagLabel: 'Bitpanda EMI',
  },
  'es-cnmv-mica': {
    keywords: ['cnmv', 'mica', 'spain', 'rulebook'],
    themes: ['regulation', 'europe'],
    tagLabel: 'CNMV MiCA',
  },
  'se-spotify-h2': {
    keywords: ['spotify', 'superfan', 'arpu'],
    themes: ['equities', 'streaming'],
    tagLabel: 'Spotify superfan',
  },
  'sa-pif-aramco': {
    keywords: ['pif', 'aramco', 'saudi', 'vision2030'],
    themes: ['energy', 'mena'],
    tagLabel: 'PIF Aramco',
  },
  'il-cyber-pump': {
    keywords: ['cyber', 'telaviv', 'israel', 'consolidation'],
    themes: ['cybersec', 'equities'],
    tagLabel: 'Tel Aviv cyber',
  },
  'vn-axie-rebound': {
    keywords: ['axie', 'ronin', 'gaming', 'p2e', 'origins'],
    themes: ['gaming', 'memes'],
    tagLabel: 'Axie origins',
  },
};

/**
 * Broad theme narratives — added so the rules tagger has natural hooks
 * for random DexScreener-promoted tokens (which skew heavily to dogs /
 * cats / pepe / AI / pump-fun memes). Without these the link layer
 * would underfire on the real-token / mock-narrative cross-source mode.
 */
const THEME_SEEDS: Seed[] = [
  {
    id: 'global-dog-coins',
    country: 'US',
    title: 'Dog memecoin rotation accelerates',
    summary:
      'Bonk, WIF, DOGE, SHIB, FLOKI, PNUT — dog-themed memes rip on the same liquidity bid.',
    volume: 78,
    sentiment: 0.55,
    momentum: 0.62,
    category: 'trending',
    ageMinutes: 95,
    sources: [
      {
        url: 'https://x.com/Cobie/status/dog1',
        author: '@Cobie',
        text: 'Every dog is back. WIF, BONK, FLOKI, MOG. Same chart.',
      },
    ],
  },
  {
    id: 'global-frog-coins',
    country: 'US',
    title: 'Frog season returns: PEPE leads the pond',
    summary:
      'PEPE, BRETT, MOG and the broader frog-meme cohort outperform majors on the day.',
    volume: 71,
    sentiment: 0.48,
    momentum: 0.58,
    category: 'trending',
    ageMinutes: 130,
    sources: [
      {
        url: 'https://x.com/0xKrane/status/frog1',
        author: '@0xKrane',
        text: 'Frogs > everything today. Pepe up bad.',
      },
    ],
  },
  {
    id: 'global-cat-coins',
    country: 'US',
    title: 'Cat memes (POPCAT, MEW) catch a bid',
    summary:
      'Cat-themed tokens lead the meme-rotation tape after a hot Asian session.',
    volume: 56,
    sentiment: 0.46,
    momentum: 0.41,
    category: 'emerging',
    ageMinutes: 220,
    sources: [
      {
        url: 'https://x.com/AltcoinPsycho/status/cat1',
        author: '@AltcoinPsycho',
        text: 'Cats > dogs this rotation. POPCAT MEW chad.',
      },
    ],
  },
  {
    id: 'global-ai-tokens',
    country: 'US',
    title: 'AI token bid: TAO, FET, RNDR, AGIX',
    summary:
      'Inference + decentralised compute names lead the AI bucket on the back of NVDA tailwinds.',
    volume: 82,
    sentiment: 0.51,
    momentum: 0.66,
    category: 'trending',
    ageMinutes: 75,
    sources: [
      {
        url: 'https://x.com/SmokeyTheBera/status/ai1',
        author: '@SmokeyTheBera',
        text: 'AI bucket lit. TAO, FET, RNDR all green.',
      },
    ],
  },
  {
    id: 'global-pump-fun',
    country: 'US',
    title: 'Pump.fun rotation: fresh launches eclipse 100k DAU',
    summary:
      'Solana memes minted in the last 24h are absorbing the marginal trader; first-day curves are vertical.',
    volume: 88,
    sentiment: 0.32,
    momentum: 0.78,
    category: 'breaking',
    ageMinutes: 28,
    sources: [
      {
        url: 'https://x.com/alon/status/pf1',
        author: '@alon',
        text: 'pump.fun is back at all-time launches/day.',
      },
    ],
  },
  {
    id: 'global-political-memes',
    country: 'US',
    title: 'Political memecoins surge into election window',
    summary:
      'Trump, MAGA, Kamala, BODEN-style political coins see a coordinated bid as poll narrative shifts.',
    volume: 74,
    sentiment: 0.18,
    momentum: 0.71,
    category: 'breaking',
    ageMinutes: 42,
    sources: [
      {
        url: 'https://x.com/MustStopMurad/status/pol1',
        author: '@MustStopMurad',
        text: 'Political memes are the highest-conviction trade for the next 60 days.',
      },
    ],
  },
  {
    id: 'global-solana-szn',
    country: 'US',
    title: 'Solana memecoin season: JUP, BONK, WIF lead',
    summary:
      'SOL ecosystem memes outperform majors; DEX volume on Raydium hits a fresh ATH.',
    volume: 84,
    sentiment: 0.61,
    momentum: 0.72,
    category: 'trending',
    ageMinutes: 110,
    sources: [
      {
        url: 'https://x.com/MustStopMurad/status/sol1',
        author: '@MustStopMurad',
        text: 'Solana is the casino. Every bid is local memes.',
      },
    ],
  },
  {
    id: 'global-nft-gaming',
    country: 'US',
    title: 'Gaming + NFT meta returns: card games, collectibles',
    summary:
      'MTG-themed coins, Pokemon variants, and on-chain collectibles see a coordinated bid.',
    volume: 49,
    sentiment: 0.42,
    momentum: 0.38,
    category: 'emerging',
    ageMinutes: 280,
    sources: [
      {
        url: 'https://x.com/AltcoinDailyio/status/nft1',
        author: '@AltcoinDailyio',
        text: 'Card-game tokens (MTG, Pokemon) catching a bid again.',
      },
    ],
  },
  {
    id: 'global-celebrity-memes',
    country: 'US',
    title: 'Celebrity / animal memes: Harambe, Vitalik, gorillas',
    summary:
      'Animal-celebrity memecoins (Harambe, gorilla, monkey variants) and Vitalik-themed tokens rotate.',
    volume: 47,
    sentiment: 0.37,
    momentum: 0.44,
    category: 'emerging',
    ageMinutes: 320,
    sources: [
      {
        url: 'https://x.com/AltcoinPsycho/status/celeb1',
        author: '@AltcoinPsycho',
        text: 'Harambe never dies. Gorilla meta is back.',
      },
    ],
  },
];

const THEME_SEED_TAG: Record<string, SeedTag> = {
  'global-dog-coins': {
    keywords: [
      'dog', 'doge', 'shib', 'bonk', 'wif', 'floki', 'pnut', 'inu',
      'hound', 'puppy', 'paws', 'paw', 'corgi', 'akita', 'husky',
    ],
    themes: ['memes', 'dogs'],
    tagLabel: 'Dog memes',
  },
  'global-frog-coins': {
    keywords: [
      'pepe', 'frog', 'brett', 'mog', 'wojak', 'hoppy', 'hopper',
      'toad', 'kek', 'rare',
    ],
    themes: ['memes', 'frogs'],
    tagLabel: 'Frog memes',
  },
  'global-cat-coins': {
    keywords: ['cat', 'popcat', 'mew', 'kitty', 'pussy', 'feline', 'whisker'],
    themes: ['memes', 'cats'],
    tagLabel: 'Cat memes',
  },
  'global-ai-tokens': {
    keywords: [
      'ai', 'tao', 'fet', 'rndr', 'agix', 'render', 'fetch',
      'bittensor', 'neural', 'gork', 'grok', 'agent', 'gpt',
    ],
    themes: ['ai'],
    tagLabel: 'AI tokens',
  },
  'global-pump-fun': {
    keywords: [
      'pump', 'fun', 'pumpfun', 'launchpad', 'launch', 'pemo', 'virl',
      'moon', 'rocket', 'rugpull',
    ],
    themes: ['memes', 'solana'],
    tagLabel: 'pump.fun',
  },
  'global-political-memes': {
    keywords: [
      'trump', 'djt', 'maga', 'kamala', 'biden', 'boden', 'putin',
      'milei', 'elon', 'pope', 'doland', 'usa', 'america', 'patriot',
      'freedom', 'woke', 'wmv', 'libtard', 'magaa',
    ],
    themes: ['memes', 'politics'],
    tagLabel: 'Political memes',
  },
  'global-solana-szn': {
    keywords: [
      'sol', 'solana', 'jup', 'jupiter', 'bonk', 'wif', 'ray',
      'raydium', 'fartcoin', 'fart',
    ],
    themes: ['solana', 'memes'],
    tagLabel: 'Solana szn',
  },
  'global-nft-gaming': {
    keywords: [
      'nft', 'gaming', 'game', 'magic', 'collect', 'collectoor',
      'gather', 'card', 'mtg', 'pokemon', 'pokepeg', 'peg', 'play',
    ],
    themes: ['gaming', 'nft'],
    tagLabel: 'NFT / Gaming',
  },
  'global-celebrity-memes': {
    keywords: [
      'harambe', 'gorilla', 'monkey', 'ape', 'chimp', 'cobie',
      'sbf', 'satoshi', 'vitalik', 'cz',
    ],
    themes: ['memes', 'celebrity'],
    tagLabel: 'Celebrity memes',
  },
};

/**
 * Hand-crafted narrative seeds covering ~20 countries. Mix of crypto, macro,
 * geopolitical, tech, and breaking news. Several have ageMinutes < 60 to drive
 * amber breaking pins.
 */
const SEEDS: Seed[] = [
  // — United States —
  {
    id: 'us-eth-etf',
    country: 'US',
    title: 'Spot ETH ETF inflows hit record $812M',
    summary:
      'Net inflows on US spot ether funds eclipse all prior daily records as ETHA leads the desk.',
    volume: 94,
    sentiment: 0.68,
    momentum: 0.72,
    category: 'trending',
    ageMinutes: 180,
    sources: [
      {
        url: 'https://x.com/eric_balchunas/status/1',
        author: '@eric_balchunas',
        text: 'ETF flows are absurd today. ETH desks just posted a new ATH for net inflows.',
      },
      {
        url: 'https://x.com/jseyff/status/2',
        author: '@jseyff',
        text: 'BlackRock ETHA alone took ~$520M. This is institutional bid, not retail.',
      },
    ],
  },
  {
    id: 'us-fomc-leak',
    country: 'US',
    title: 'Fed dot plot hints at two cuts before year-end',
    summary:
      'Reuters and Bloomberg both report sources expecting a dovish revision at the next FOMC.',
    volume: 88,
    sentiment: 0.32,
    momentum: 0.55,
    category: 'breaking',
    ageMinutes: 38,
    sources: [
      {
        url: 'https://x.com/nicktimiraos/status/3',
        author: '@nicktimiraos',
        text: 'Sources: dot plot expected to drift lower; two cuts now baseline scenario.',
      },
    ],
  },
  {
    id: 'us-nvidia-earnings',
    country: 'US',
    title: 'NVIDIA pre-earnings positioning at decade highs',
    summary:
      'Options skew suggests traders are paying up for upside ahead of Wednesday print.',
    volume: 79,
    sentiment: 0.41,
    momentum: 0.18,
    category: 'trending',
    ageMinutes: 540,
    sources: [
      {
        url: 'https://x.com/zerohedge/status/4',
        author: '@zerohedge',
        text: 'NVDA call wing the most expensive it has been all year vs puts.',
      },
    ],
  },

  // — China —
  {
    id: 'cn-pboc-rrr',
    country: 'CN',
    title: 'PBOC unexpectedly cuts RRR by 25bps',
    summary:
      'Surprise easing aimed at supporting property and exporter financing through Q2.',
    volume: 91,
    sentiment: 0.22,
    momentum: 0.81,
    category: 'breaking',
    ageMinutes: 22,
    sources: [
      {
        url: 'https://x.com/SinoMarket/status/5',
        author: '@SinoMarket',
        text: 'PBOC RRR -25bps. Statement explicitly cites property + SME credit conditions.',
      },
    ],
  },
  {
    id: 'cn-deepseek-v4',
    country: 'CN',
    title: 'DeepSeek v4 weights drop with multimodal vision',
    summary:
      'Open-weights release benchmarks within striking distance of GPT-class models on MMLU.',
    volume: 84,
    sentiment: 0.62,
    momentum: 0.69,
    category: 'trending',
    ageMinutes: 410,
    sources: [
      {
        url: 'https://x.com/deepseek_ai/status/6',
        author: '@deepseek_ai',
        text: 'DeepSeek-V4 base + chat weights are live. Vision tower is new.',
      },
    ],
  },

  // — Japan —
  {
    id: 'jp-yen-intervention',
    country: 'JP',
    title: 'MoF readies FX intervention as USDJPY presses 162',
    summary:
      'Vice-finance minister jawboning intensifies; rate-check headlines circulating.',
    volume: 76,
    sentiment: -0.08,
    momentum: 0.44,
    category: 'trending',
    ageMinutes: 240,
    sources: [
      {
        url: 'https://x.com/SugaSan/status/7',
        author: '@SugaSan',
        text: 'Kanda just escalated language. Rate checks already happening.',
      },
    ],
  },
  {
    id: 'jp-sony-ai-chip',
    country: 'JP',
    title: 'Sony unveils edge AI imaging chip for robotics',
    summary:
      'New IMX sensor stack does on-device inference at 4W envelope.',
    volume: 51,
    sentiment: 0.55,
    momentum: 0.21,
    category: 'emerging',
    ageMinutes: 720,
    sources: [
      {
        url: 'https://x.com/Sony_Tech/status/8',
        author: '@Sony_Tech',
        text: 'Edge inference at sensor stack — interesting for warehouse robotics.',
      },
    ],
  },

  // — South Korea —
  {
    id: 'kr-upbit-listing',
    country: 'KR',
    title: 'Upbit signals new KRW pair for sector mid-cap',
    summary:
      'Wallet integration probes detected by on-chain sleuths ahead of suspected listing.',
    volume: 72,
    sentiment: 0.38,
    momentum: 0.74,
    category: 'breaking',
    ageMinutes: 44,
    sources: [
      {
        url: 'https://x.com/onchainKr/status/9',
        author: '@onchainKr',
        text: 'Upbit deposit address spun up at 03:18 KST. Pair imminent.',
      },
    ],
  },
  {
    id: 'kr-samsung-hbm',
    country: 'KR',
    title: 'Samsung HBM4 qualification with NVIDIA reportedly progressing',
    summary:
      'Local press cites supply chain sources expecting volume ship by Q4.',
    volume: 64,
    sentiment: 0.5,
    momentum: 0.32,
    category: 'trending',
    ageMinutes: 380,
    sources: [
      {
        url: 'https://x.com/chosunbiz/status/10',
        author: '@chosunbiz',
        text: 'HBM4 qual moving forward — Samsung should not be written off.',
      },
    ],
  },

  // — United Kingdom —
  {
    id: 'gb-fca-stable',
    country: 'GB',
    title: 'FCA opens consultation on sterling stablecoin regime',
    summary:
      'Consultation paper sets reserves, audit, and redemption standards for GBP-pegged tokens.',
    volume: 58,
    sentiment: 0.34,
    momentum: 0.41,
    category: 'trending',
    ageMinutes: 300,
    sources: [
      {
        url: 'https://x.com/TheFCA/status/11',
        author: '@TheFCA',
        text: 'Consultation now open. Comments due in 12 weeks.',
      },
    ],
  },
  {
    id: 'gb-arm-takeover',
    country: 'GB',
    title: 'Arm explores M&A in custom-silicon startups',
    summary:
      'FT reports two early-stage talks; targets focused on inference accelerators.',
    volume: 47,
    sentiment: 0.18,
    momentum: 0.27,
    category: 'emerging',
    ageMinutes: 600,
    sources: [
      {
        url: 'https://x.com/FT/status/12',
        author: '@FT',
        text: 'Arm boardroom appetite for M&A is the highest it has been since IPO.',
      },
    ],
  },

  // — Germany —
  {
    id: 'de-bafin-pump',
    country: 'DE',
    title: 'BaFin warns on memecoin promotion influencers',
    summary:
      'Regulator names six accounts with combined 4M followers; civil action being prepared.',
    volume: 53,
    sentiment: -0.32,
    momentum: 0.29,
    category: 'trending',
    ageMinutes: 220,
    sources: [
      {
        url: 'https://x.com/BaFin_Bund/status/13',
        author: '@BaFin_Bund',
        text: 'Warnung: koordinierte Promotion erfüllt teils §20a WpHG.',
      },
    ],
  },
  {
    id: 'de-vw-ev-deal',
    country: 'DE',
    title: 'VW + Rivian JV expands to commercial vans',
    summary:
      'Software platform deal scope grows; production target 2027.',
    volume: 44,
    sentiment: 0.42,
    momentum: 0.16,
    category: 'emerging',
    ageMinutes: 880,
    sources: [
      {
        url: 'https://x.com/handelsblatt/status/14',
        author: '@handelsblatt',
        text: 'Joint venture wird auf leichte Nutzfahrzeuge ausgeweitet.',
      },
    ],
  },

  // — France —
  {
    id: 'fr-ai-act-impl',
    country: 'FR',
    title: 'CNIL publishes AI Act implementation guidance',
    summary:
      'Guidance clarifies model-card and red-teaming obligations for GPAI providers.',
    volume: 49,
    sentiment: 0.12,
    momentum: 0.22,
    category: 'trending',
    ageMinutes: 200,
    sources: [
      {
        url: 'https://x.com/CNIL/status/15',
        author: '@CNIL',
        text: 'Lignes directrices AI Act publiées ce matin.',
      },
    ],
  },

  // — UAE —
  {
    id: 'ae-vara-license',
    country: 'AE',
    title: 'VARA grants full VASP license to top-3 exchange',
    summary:
      'License covers spot, derivatives, and custody under tier 1 capital regime.',
    volume: 67,
    sentiment: 0.59,
    momentum: 0.61,
    category: 'breaking',
    ageMinutes: 50,
    sources: [
      {
        url: 'https://x.com/VARA_Dubai/status/16',
        author: '@VARA_Dubai',
        text: 'Full operational license issued under DIFC framework.',
      },
    ],
  },
  {
    id: 'ae-adq-ai',
    country: 'AE',
    title: 'ADQ commits $5B to sovereign AI compute fund',
    summary:
      'Fund to underwrite GPU procurement and Arabic-LLM research.',
    volume: 52,
    sentiment: 0.48,
    momentum: 0.34,
    category: 'trending',
    ageMinutes: 470,
    sources: [
      {
        url: 'https://x.com/TheNationalUAE/status/17',
        author: '@TheNationalUAE',
        text: 'ADQ + G42 standing up new compute fund.',
      },
    ],
  },

  // — India —
  {
    id: 'in-rbi-cbdc',
    country: 'IN',
    title: 'RBI digital rupee crosses 1M daily transactions',
    summary:
      'Retail CBDC pilot expansion now covers all metro circles.',
    volume: 61,
    sentiment: 0.36,
    momentum: 0.39,
    category: 'trending',
    ageMinutes: 340,
    sources: [
      {
        url: 'https://x.com/RBI/status/18',
        author: '@RBI',
        text: 'eRupee pilot at 1.04M tx/day. Onboarding 14 banks.',
      },
    ],
  },
  {
    id: 'in-zomato-blink',
    country: 'IN',
    title: 'Zomato spins out Blinkit at $14B valuation',
    summary:
      'Quick-commerce arm to list separately on NSE within 18 months.',
    volume: 56,
    sentiment: 0.27,
    momentum: 0.46,
    category: 'trending',
    ageMinutes: 260,
    sources: [
      {
        url: 'https://x.com/livemint/status/19',
        author: '@livemint',
        text: 'Demerger filing expected next quarter.',
      },
    ],
  },

  // — Singapore —
  {
    id: 'sg-mas-tokenize',
    country: 'SG',
    title: 'MAS tokenized-deposit pilot adds 4 banks',
    summary:
      'Project Guardian phase 3 opens to additional FX and sustainability use cases.',
    volume: 57,
    sentiment: 0.51,
    momentum: 0.43,
    category: 'trending',
    ageMinutes: 320,
    sources: [
      {
        url: 'https://x.com/MAS_sg/status/20',
        author: '@MAS_sg',
        text: 'Project Guardian — Phase 3 cohort announced.',
      },
    ],
  },

  // — Hong Kong —
  {
    id: 'hk-spot-eth-etf',
    country: 'HK',
    title: 'HK spot ETH ETF AUM passes $300M',
    summary:
      'Strong Asia-session demand; staking variant approval rumoured for Q3.',
    volume: 60,
    sentiment: 0.55,
    momentum: 0.5,
    category: 'trending',
    ageMinutes: 280,
    sources: [
      {
        url: 'https://x.com/SCMPNews/status/21',
        author: '@SCMPNews',
        text: 'Asia-listed spot ETH ETFs gathering steam.',
      },
    ],
  },

  // — Australia —
  {
    id: 'au-asx-block',
    country: 'AU',
    title: 'ASX revisits CHESS replacement with DLT vendor',
    summary:
      'New RFP indicates appetite to revive distributed-ledger settlement program.',
    volume: 33,
    sentiment: 0.05,
    momentum: 0.12,
    category: 'emerging',
    ageMinutes: 700,
    sources: [
      {
        url: 'https://x.com/AFR/status/22',
        author: '@AFR',
        text: 'ASX warming back up to DLT, but cautiously.',
      },
    ],
  },

  // — Brazil —
  {
    id: 'br-pix-stable',
    country: 'BR',
    title: 'BCB green-lights stablecoin rails into PIX',
    summary:
      'Pilot lets fintechs settle USDC via central bank instant rails.',
    volume: 55,
    sentiment: 0.48,
    momentum: 0.58,
    category: 'breaking',
    ageMinutes: 35,
    sources: [
      {
        url: 'https://x.com/BancoCentralBR/status/23',
        author: '@BancoCentralBR',
        text: 'Programa piloto autoriza liquidação cripto via PIX.',
      },
    ],
  },
  {
    id: 'br-petr-buyback',
    country: 'BR',
    title: 'Petrobras announces $4B buyback',
    summary:
      'Capital return package larger than street consensus.',
    volume: 41,
    sentiment: 0.36,
    momentum: 0.2,
    category: 'trending',
    ageMinutes: 540,
    sources: [
      {
        url: 'https://x.com/petrobras/status/24',
        author: '@petrobras',
        text: 'Programa de recompra aprovado.',
      },
    ],
  },

  // — Argentina —
  {
    id: 'ar-milei-dolar',
    country: 'AR',
    title: 'Milei signals timeline for full dollarisation',
    summary:
      'Cabinet expects parallel-rate convergence by end of fiscal year.',
    volume: 63,
    sentiment: -0.05,
    momentum: 0.66,
    category: 'breaking',
    ageMinutes: 25,
    sources: [
      {
        url: 'https://x.com/JMilei/status/25',
        author: '@JMilei',
        text: 'Vamos a llegar a la dolarización plena este año fiscal.',
      },
    ],
  },

  // — Mexico —
  {
    id: 'mx-banxico-hold',
    country: 'MX',
    title: 'Banxico holds at 11% citing peso volatility',
    summary:
      'Statement strikes a hawkish tilt despite cooling core CPI.',
    volume: 38,
    sentiment: 0.04,
    momentum: 0.11,
    category: 'trending',
    ageMinutes: 410,
    sources: [
      {
        url: 'https://x.com/Banxico/status/26',
        author: '@Banxico',
        text: 'Tasa objetivo permanece en 11.00%.',
      },
    ],
  },

  // — Russia —
  {
    id: 'ru-mining-tax',
    country: 'RU',
    title: 'State Duma fast-tracks crypto-mining tax bill',
    summary:
      'Bill imposes power-tariff surcharge on registered mining sites.',
    volume: 36,
    sentiment: -0.18,
    momentum: 0.24,
    category: 'emerging',
    ageMinutes: 800,
    sources: [
      {
        url: 'https://x.com/Interfax/status/27',
        author: '@Interfax',
        text: 'Законопроект прошёл первое чтение.',
      },
    ],
  },

  // — Turkey —
  {
    id: 'tr-cbrt-rate',
    country: 'TR',
    title: 'CBRT surprise 250bps hike to 50%',
    summary:
      'Central bank doubles down on disinflation path.',
    volume: 59,
    sentiment: -0.12,
    momentum: 0.71,
    category: 'breaking',
    ageMinutes: 18,
    sources: [
      {
        url: 'https://x.com/TCMB/status/28',
        author: '@TCMB',
        text: 'Politika faizi %47.5\'ten %50.0\'a yükseltildi.',
      },
    ],
  },

  // — Nigeria —
  {
    id: 'ng-binance-suit',
    country: 'NG',
    title: 'Court rules in favour of Binance executive bail',
    summary:
      'Tigran Gambaryan release order signed; case ongoing.',
    volume: 45,
    sentiment: 0.23,
    momentum: 0.37,
    category: 'trending',
    ageMinutes: 360,
    sources: [
      {
        url: 'https://x.com/PremiumTimesng/status/29',
        author: '@PremiumTimesng',
        text: 'Bail granted on humanitarian grounds.',
      },
    ],
  },

  // — South Africa —
  {
    id: 'za-rand-bond',
    country: 'ZA',
    title: 'SARB pencils in 2 cuts after rand stabilises',
    summary:
      'MPC minutes show shift in dovish bloc.',
    volume: 31,
    sentiment: 0.19,
    momentum: 0.14,
    category: 'emerging',
    ageMinutes: 920,
    sources: [
      {
        url: 'https://x.com/SAReserveBank/status/30',
        author: '@SAReserveBank',
        text: 'MPC vote split 3-2 in favour of hold.',
      },
    ],
  },

  // — Canada —
  {
    id: 'ca-boc-cut',
    country: 'CA',
    title: 'BoC delivers 25bps cut, signals data dependence',
    summary:
      'Macklem leaves door open to consecutive cuts.',
    volume: 48,
    sentiment: 0.31,
    momentum: 0.42,
    category: 'trending',
    ageMinutes: 230,
    sources: [
      {
        url: 'https://x.com/bankofcanada/status/31',
        author: '@bankofcanada',
        text: 'Policy rate now 4.50%.',
      },
    ],
  },
  {
    id: 'ca-shopify-ai',
    country: 'CA',
    title: 'Shopify rolls out AI-storefront defaults',
    summary:
      'Sidekick now enabled by default for Plus tier merchants.',
    volume: 39,
    sentiment: 0.41,
    momentum: 0.26,
    category: 'emerging',
    ageMinutes: 680,
    sources: [
      {
        url: 'https://x.com/tobi/status/32',
        author: '@tobi',
        text: 'AI-first storefronts. Default-on for Plus.',
      },
    ],
  },

  // — Switzerland —
  {
    id: 'ch-finma-stake',
    country: 'CH',
    title: 'FINMA blesses staking-as-a-service custodian',
    summary:
      'License clarifies treatment of pooled validator rewards.',
    volume: 34,
    sentiment: 0.47,
    momentum: 0.31,
    category: 'emerging',
    ageMinutes: 750,
    sources: [
      {
        url: 'https://x.com/FINMA_media/status/33',
        author: '@FINMA_media',
        text: 'Lizenz für Staking-as-a-Service erteilt.',
      },
    ],
  },

  // — Netherlands —
  {
    id: 'nl-asml-litho',
    country: 'NL',
    title: 'ASML High-NA EUV ramp accelerates',
    summary:
      'Two new tools shipped this quarter; backlog stable.',
    volume: 42,
    sentiment: 0.44,
    momentum: 0.28,
    category: 'trending',
    ageMinutes: 470,
    sources: [
      {
        url: 'https://x.com/ASMLcompany/status/34',
        author: '@ASMLcompany',
        text: 'High-NA tool 3 + 4 in production.',
      },
    ],
  },

  // — Italy —
  {
    id: 'it-bitpanda-eu',
    country: 'IT',
    title: 'Bitpanda secures Italian EMI license',
    summary:
      'License speeds passporting under MiCA framework.',
    volume: 28,
    sentiment: 0.36,
    momentum: 0.18,
    category: 'emerging',
    ageMinutes: 820,
    sources: [
      {
        url: 'https://x.com/Bitpanda/status/35',
        author: '@Bitpanda',
        text: 'Italian EMI license now active.',
      },
    ],
  },

  // — Spain —
  {
    id: 'es-cnmv-mica',
    country: 'ES',
    title: 'CNMV publishes MiCA local rulebook',
    summary:
      'Rulebook adds disclosure overlay on top of EU baseline.',
    volume: 32,
    sentiment: 0.21,
    momentum: 0.2,
    category: 'emerging',
    ageMinutes: 690,
    sources: [
      {
        url: 'https://x.com/CNMV/status/36',
        author: '@CNMV',
        text: 'Adoptamos el reglamento MiCA con guías locales.',
      },
    ],
  },

  // — Sweden —
  {
    id: 'se-spotify-h2',
    country: 'SE',
    title: 'Spotify guides 2H ARPU up on superfan tier',
    summary:
      'Premium-plus rollout to broaden in EU markets next month.',
    volume: 30,
    sentiment: 0.39,
    momentum: 0.22,
    category: 'emerging',
    ageMinutes: 760,
    sources: [
      {
        url: 'https://x.com/Spotify/status/37',
        author: '@Spotify',
        text: 'Superfan tier expanding next month.',
      },
    ],
  },

  // — Saudi Arabia —
  {
    id: 'sa-pif-aramco',
    country: 'SA',
    title: 'PIF buys $2B more Aramco at discount',
    summary:
      'Sovereign rebalancing accelerates ahead of Vision 2030 milestone.',
    volume: 40,
    sentiment: 0.27,
    momentum: 0.25,
    category: 'trending',
    ageMinutes: 510,
    sources: [
      {
        url: 'https://x.com/Aramco/status/38',
        author: '@Aramco',
        text: 'PIF stake reshuffling complete.',
      },
    ],
  },

  // — Israel —
  {
    id: 'il-cyber-pump',
    country: 'IL',
    title: 'Tel Aviv cyber roll-up forms $3B platform',
    summary:
      'Three private firms combine under PE-led platform.',
    volume: 35,
    sentiment: 0.34,
    momentum: 0.3,
    category: 'emerging',
    ageMinutes: 640,
    sources: [
      {
        url: 'https://x.com/CalcalisTech/status/39',
        author: '@CalcalisTech',
        text: 'Tel Aviv cyber consolidation accelerates.',
      },
    ],
  },

  // — Vietnam —
  {
    id: 'vn-axie-rebound',
    country: 'VN',
    title: 'Axie Infinity DAU back above 200K',
    summary:
      'Origins season 8 + new land mechanics drive return-user growth.',
    volume: 29,
    sentiment: 0.46,
    momentum: 0.52,
    category: 'emerging',
    ageMinutes: 600,
    sources: [
      {
        url: 'https://x.com/SkyMavisHQ/status/40',
        author: '@SkyMavisHQ',
        text: 'Origins season 8 brought a real bounce.',
      },
    ],
  },
];

const TIME_WINDOW_VOLUME_FACTOR: Record<TimeWindow, number> = {
  '1h': 0.55, // 1h is more volatile but lower absolute volume
  '24h': 1.0,
  '7d': 1.15, // smoother, slightly larger aggregate
};

function shapeForWindow(seed: Seed, window: TimeWindow, now: number) {
  const ageMs = seed.ageMinutes * 60 * 1000;
  const firstSeen = new Date(now - ageMs).toISOString();
  const lastUpdated = new Date(now - Math.min(ageMs, 8 * 60 * 1000)).toISOString();

  // For 1h window, anything older than ~2h falls off the breaking pile.
  let category = seed.category;
  if (window === '1h' && seed.ageMinutes > 60 && seed.category === 'breaking') {
    category = 'trending';
  }

  // Re-score volume per-window so the toggle visibly changes pin sizes.
  const volume = Math.max(
    1,
    Math.min(100, Math.round(seed.volume * TIME_WINDOW_VOLUME_FACTOR[window]))
  );

  return { firstSeen, lastUpdated, category, volume };
}

/** Fallback used when a seed has no SEED_TAG entry — keeps the type
 *  honest and the tagger from crashing on `undefined.keywords`. */
const EMPTY_TAG: SeedTag = { keywords: [], themes: [], tagLabel: '' };

function tagForSeed(id: string): SeedTag {
  return SEED_TAG[id] ?? THEME_SEED_TAG[id] ?? EMPTY_TAG;
}

export class MockProvider implements NarrativeProvider {
  readonly id = 'mock' as const;

  async fetch(window: TimeWindow): Promise<Narrative[]> {
    const now = Date.now();
    const allSeeds = [...SEEDS, ...THEME_SEEDS];

    const shaped = allSeeds.map((seed) => {
      const { firstSeen, lastUpdated, category, volume } = shapeForWindow(
        seed,
        window,
        now
      );
      const tagMeta = tagForSeed(seed.id);
      return {
        seed,
        narrative: {
          id: seed.id,
          country: seed.country,
          title: seed.title,
          summary: seed.summary,
          volume,
          sentiment: seed.sentiment,
          momentum: seed.momentum,
          rank: 0, // filled below
          category,
          sources: seed.sources,
          firstSeen,
          lastUpdated,
          timeWindow: window,
          // Link-layer fields populated from the side maps.
          keywords: tagMeta.keywords,
          themes: tagMeta.themes,
          tagLabel: tagMeta.tagLabel || seed.title.slice(0, 32),
          relatedTokenIds: [],
        } as Narrative,
      };
    });

    // Per-country rank by volume desc.
    const byCountry = new Map<string, typeof shaped>();
    for (const s of shaped) {
      const arr = byCountry.get(s.narrative.country) ?? [];
      arr.push(s);
      byCountry.set(s.narrative.country, arr);
    }
    for (const arr of byCountry.values()) {
      arr.sort((a, b) => b.narrative.volume - a.narrative.volume);
      arr.forEach((s, i) => {
        s.narrative.rank = i + 1;
      });
    }

    return shaped.map((s) => s.narrative);
  }
}
