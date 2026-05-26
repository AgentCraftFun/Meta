import type { ChainFilter } from '../store';
import type { TokenChain } from '../types/token';

/** Rail order. 'all' first, then by ecosystem weight. */
export const CHAIN_ROWS: { id: ChainFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'solana', label: 'Solana' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'base', label: 'Base' },
  { id: 'bsc', label: 'BSC' },
];

/** Mini chain badges shown next to the token ticker in the table. Two
 *  chars max, monochrome — designed to read at 9px without color cues. */
export const CHAIN_BADGE: Record<TokenChain, string> = {
  solana: 'SOL',
  ethereum: 'ETH',
  base: 'BASE',
  bsc: 'BSC',
  other: '—',
};
