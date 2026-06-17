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

/** $STAR — the Starship Protocol token that taxes trades, swaps the cut to
 *  $SPCX, and distributes it to holders. "Total distributed" is the sum of all
 *  $SPCX sent OUT of this address. */
export const STAR_ADDRESS = '0x7e4e1aF275BFfbe00C7D823F4868C27FAcF26459';

// $STAR deploy block — distributions can't predate it, so the scan starts here.
const DISTRIB_START_BLOCK = 25337419;
// keccak256("Transfer(address,address,uint256)") + $STAR as an indexed `from`.
const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const STAR_FROM_TOPIC = `0x${STAR_ADDRESS.toLowerCase().slice(2).padStart(64, '0')}`;

// Public mainnet RPCs (CORS-enabled). Tried in order; first good answer wins.
const RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.drpc.org',
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
];

// RPCs that support eth_getLogs over a 50k-block range with CORS (verified).
const LOG_RPCS = ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org'];
const MAX_LOG_RANGE = 50000;

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

type LogEntry = { data?: string };

/** One JSON-RPC call to a single endpoint. Throws on HTTP / RPC error. */
async function rpcCall(rpc: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (json.error) throw new Error(json.error.message ?? 'RPC error');
  return json.result;
}

/** Sum every $SPCX Transfer whose `from` is the $STAR contract = total ever
 *  distributed to holders (raw base units), scanned in <=50k-block windows. */
async function sumDistributedRaw(rpc: string): Promise<bigint> {
  // Stop a few blocks behind head: load-balanced RPCs can serve eth_getLogs from
  // a node a block or two behind eth_blockNumber, which errors as "unknown
  // block". The ~1min lag is moot (the result is cached for 60s anyway).
  const head = Number(hexToBigInt((await rpcCall(rpc, 'eth_blockNumber', [])) as string)) - 6;
  let sum = 0n;
  for (let from = DISTRIB_START_BLOCK; from <= head; from += MAX_LOG_RANGE) {
    const to = Math.min(from + MAX_LOG_RANGE - 1, head);
    const logs = (await rpcCall(rpc, 'eth_getLogs', [
      {
        address: SPCX_ADDRESS,
        topics: [TRANSFER_TOPIC, STAR_FROM_TOPIC],
        fromBlock: `0x${from.toString(16)}`,
        toBlock: `0x${to.toString(16)}`,
      },
    ])) as LogEntry[];
    for (const log of logs) sum += hexToBigInt(log.data);
  }
  return sum;
}

// Total-distributed is wallet-independent and a little heavy, so cache it briefly.
let distribCache: { raw: bigint; at: number } | null = null;
const DISTRIB_TTL = 60_000;

/** Total $SPCX distributed by $STAR (raw base units), cached, with failover. */
async function getTotalDistributedRaw(): Promise<bigint> {
  if (distribCache && Date.now() - distribCache.at < DISTRIB_TTL) return distribCache.raw;
  let lastErr: unknown;
  for (const rpc of LOG_RPCS) {
    try {
      const raw = await sumDistributedRaw(rpc);
      distribCache = { raw, at: Date.now() };
      return raw;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('getLogs unavailable');
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
  /** Total $SPCX the $STAR contract has distributed to holders (sum of outgoing
   *  transfers), human units. null if the log scan was unavailable. */
  totalDistributed: number | null;
};

/** Look up a wallet's on-chain $SPCX position. Throws TrackerError on failure. */
export async function getSpcxRewards(walletInput: string): Promise<SpcxRewards> {
  const wallet = walletInput.trim();
  if (!isAddress(wallet)) {
    throw new TrackerError('INVALID_ADDRESS', 'Enter a valid Ethereum address (0x…).');
  }

  const [map, distRaw] = await Promise.all([
    batchWithFailover(wallet),
    // Total distributed is best-effort: a getLogs failure must not break the
    // wallet lookup (the balance is the primary read).
    getTotalDistributedRaw().catch(() => null),
  ]);
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
  const totalDistributed = distRaw !== null ? formatUnits(distRaw, decimals) : null;

  return { wallet, decimals, rawBalance, amount, totalSupply, sharePct, totalDistributed };
}
