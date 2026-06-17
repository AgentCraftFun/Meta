/**
 * Read-only $SPCX on-chain reader for the Mars Tracker.
 *
 * No wallet connection and no web3 dependency: we hand-encode three ERC-20 view
 * calls (decimals / balanceOf / totalSupply), send them as ONE batched eth_call
 * to a public Ethereum RPC straight from the visitor's browser, and decode the
 * uint256 results ourselves. Reads run against the on-chain $SPCX contract on
 * Ethereum mainnet — confirmed an upgradeable ERC-20 proxy, 18 decimals.
 */

export const SPCX_ADDRESS = '0x68fa48B1C2FE52b3D776E1953e0E782b5044Ce28';

// Public mainnet RPCs (CORS-enabled). Tried in order; first good answer wins.
const RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://cloudflare-eth.com',
];

// ERC-20 view selectors (first 4 bytes of keccak256(signature)).
const SEL = {
  decimals: '0x313ce567',
  balanceOf: '0x70a08231',
  totalSupply: '0x18160ddd',
} as const;

// Stable numeric ids for the batched request.
const ID = { decimals: 1, balanceOf: 2, totalSupply: 3 } as const;

export type TrackerErrorCode = 'INVALID_ADDRESS' | 'NETWORK' | 'NO_CONTRACT';

export class TrackerError extends Error {
  code: TrackerErrorCode;
  constructor(code: TrackerErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'TrackerError';
  }
}

/** Strict 0x + 40 hex. Checksum is not enforced so pasted lowercase works. */
export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

/** Left-pad a 20-byte address to a 32-byte ABI word. */
function encodeAddressArg(addr: string): string {
  return addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function hexToBigInt(hex: string | undefined): bigint {
  if (!hex || hex === '0x') return 0n;
  try {
    return BigInt(hex);
  } catch {
    return 0n;
  }
}

/** base-unit bigint → JS number, capped fractional precision (no rounding up). */
function formatUnits(raw: bigint, decimals: number, maxFrac = 8): number {
  if (decimals <= 0) return Number(raw);
  const s = raw.toString().padStart(decimals + 1, '0');
  const int = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).slice(0, maxFrac);
  return Number(`${int}.${frac || '0'}`);
}

type RpcResult = { id: number; result?: string; error?: { message?: string } };

/** One batched eth_call to a single RPC. Returns results keyed by id. */
async function batchCall(rpc: string, wallet: string): Promise<Map<number, string>> {
  const body = [
    { jsonrpc: '2.0', id: ID.decimals, method: 'eth_call', params: [{ to: SPCX_ADDRESS, data: SEL.decimals }, 'latest'] },
    { jsonrpc: '2.0', id: ID.balanceOf, method: 'eth_call', params: [{ to: SPCX_ADDRESS, data: SEL.balanceOf + encodeAddressArg(wallet) }, 'latest'] },
    { jsonrpc: '2.0', id: ID.totalSupply, method: 'eth_call', params: [{ to: SPCX_ADDRESS, data: SEL.totalSupply }, 'latest'] },
  ];

  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: RpcResult | RpcResult[] = await res.json();
  const rows = Array.isArray(json) ? json : [json];
  const map = new Map<number, string>();
  for (const row of rows) {
    if (row && typeof row.id === 'number' && typeof row.result === 'string') {
      map.set(row.id, row.result);
    }
  }
  // A working RPC answers at least balanceOf; otherwise treat as a failure and
  // let the caller fail over to the next endpoint.
  if (!map.has(ID.balanceOf)) throw new Error('Empty RPC response');
  return map;
}

async function batchWithFailover(wallet: string): Promise<Map<number, string>> {
  let lastErr: unknown;
  for (const rpc of RPCS) {
    try {
      return await batchCall(rpc, wallet);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new TrackerError(
    'NETWORK',
    lastErr instanceof Error ? lastErr.message : 'Could not reach an Ethereum node.',
  );
}

export type SpcxRewards = {
  wallet: string;
  decimals: number;
  rawBalance: bigint;
  /** $SPCX held by the wallet, human units. */
  amount: number;
  /** Total $SPCX in existence, human units. */
  totalSupply: number;
  /** amount / totalSupply * 100. */
  sharePct: number;
};

/** Look up a wallet's on-chain $SPCX position. Throws TrackerError on failure. */
export async function getSpcxRewards(walletInput: string): Promise<SpcxRewards> {
  const wallet = walletInput.trim();
  if (!isAddress(wallet)) {
    throw new TrackerError('INVALID_ADDRESS', 'Enter a valid Ethereum address (0x…).');
  }

  const map = await batchWithFailover(wallet);
  const decHex = map.get(ID.decimals);
  const balHex = map.get(ID.balanceOf);
  const supHex = map.get(ID.totalSupply);

  // Live ERC-20 answers decimals(); if both core reads are empty, no token here.
  if ((!decHex || decHex === '0x') && (!balHex || balHex === '0x')) {
    throw new TrackerError('NO_CONTRACT', 'The $SPCX contract is not responding right now.');
  }

  const decimals = decHex && decHex !== '0x' ? Number(hexToBigInt(decHex)) : 18;
  const rawBalance = hexToBigInt(balHex);
  const totalSupply = formatUnits(hexToBigInt(supHex), decimals);
  const amount = formatUnits(rawBalance, decimals);
  const sharePct = totalSupply > 0 ? (amount / totalSupply) * 100 : 0;

  return { wallet, decimals, rawBalance, amount, totalSupply, sharePct };
}
