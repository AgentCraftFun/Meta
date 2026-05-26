'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { shortAddress } from '@/lib/format';
import { useToastStore } from '@/lib/useToast';
import { useWatchlist } from '@/lib/useWatchlist';
import type { Token } from '@/lib/types/token';

const CHAIN_LABEL: Record<Token['chain'], string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  base: 'Base',
  bsc: 'BSC',
  other: 'Other',
};

type Props = {
  token: Token;
  chain: string;
  address: string;
};

/**
 * 64px header strip. Back chevron is dynamic — reads document.referrer
 * once on mount and prefers the most recent same-origin route over
 * blind history.back().
 */
export default function TokenHeader({ token, chain, address }: Props) {
  const router = useRouter();
  const { backLabel, backHref } = useBackTarget();
  const { starred, toggle } = useWatchlist(chain, address);
  const show = useToastStore((s) => s.show);

  const copy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => show(`${label} copied`, { tone: 'success' }))
      .catch(() => show('Copy failed', { tone: 'error' }));
  };

  return (
    <header
      role="banner"
      aria-label="Token header"
      className="flex h-16 shrink-0 items-center gap-ds5 border-b border-ds-border-subtle bg-ds-bg-base px-ds5 font-ds-mono"
    >
      <button
        type="button"
        onClick={() => {
          // history.back() if we have a same-origin referrer in the
          // session — gives proper scroll restoration on the Terminal
          // table. Otherwise push, which forks a fresh entry.
          if (window.history.length > 1 && backHref === backHrefFromReferrer()) {
            router.back();
          } else {
            router.push(backHref);
          }
        }}
        className="flex items-center gap-ds2 text-[10px] uppercase tracking-[0.36em] text-ds-text-secondary hover:text-ds-text-primary"
        aria-label={`Back to ${backLabel}`}
      >
        <span aria-hidden>←</span>
        <span>{backLabel}</span>
      </button>

      <span aria-hidden className="h-5 w-px bg-ds-border-subtle" />

      <div className="flex items-center gap-ds3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md border border-ds-border-strong bg-ds-bg-surfaceHi text-[11px] uppercase tracking-[0.16em] text-ds-text-primary"
        >
          {token.symbol.slice(0, 3)}
        </span>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-ds2">
            <h1 className="text-[20px] font-bold uppercase tracking-[0.16em] text-ds-text-primary">
              {token.symbol}
            </h1>
            <span className="text-[12px] text-ds-text-secondary">
              {token.name}
            </span>
          </div>
          <div className="flex items-center gap-ds2 text-[10px] uppercase tracking-[0.28em] text-ds-text-tertiary">
            <span className="rounded-ds-sm border border-ds-border-subtle bg-ds-bg-surface px-ds2 py-[1px] text-ds-text-secondary">
              {CHAIN_LABEL[token.chain]}
            </span>
            {token.contractAddress && (
              <button
                type="button"
                onClick={() => copy(token.contractAddress!, 'Address')}
                title={token.contractAddress}
                aria-label="Copy contract address"
                className="inline-flex items-center gap-ds1 rounded-ds-sm border border-transparent px-ds1 py-[1px] hover:border-ds-border-strong hover:text-ds-text-primary"
              >
                <span data-numeric="true" className="tabular-nums">
                  {shortAddress(token.contractAddress, 6, 6)}
                </span>
                <CopyIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-ds2">
        <button
          type="button"
          onClick={() => {
            toggle();
            show(
              starred ? 'Removed from watchlist' : 'Added to watchlist',
              { tone: 'info' }
            );
          }}
          aria-pressed={starred}
          aria-label={starred ? 'Remove from watchlist' : 'Add to watchlist'}
          className={[
            'flex h-8 items-center gap-ds2 rounded-ds-sm border px-ds3 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
            starred
              ? 'border-ds-accent-warn/60 bg-ds-accent-warn/10 text-ds-accent-warn'
              : 'border-ds-border-strong bg-ds-bg-surface text-ds-text-secondary hover:border-ds-accent-warn/40 hover:text-ds-text-primary',
          ].join(' ')}
        >
          <StarIcon filled={starred} />
          <span>{starred ? 'Watching' : 'Watchlist'}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            copy(typeof window !== 'undefined' ? window.location.href : '', 'Link')
          }
          aria-label="Copy share link"
          className="flex h-8 items-center gap-ds2 rounded-ds-sm border border-ds-border-strong bg-ds-bg-surface px-ds3 text-[10px] uppercase tracking-[0.32em] text-ds-text-secondary hover:border-ds-accent-cyan/40 hover:text-ds-text-primary"
        >
          <ShareIcon />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}

/** Reads document.referrer once. If it points to /terminal or /watchlist
 *  the back chevron says "Terminal"; if /map or /moon it says "Map";
 *  otherwise default to Terminal (the new landing). */
function useBackTarget() {
  const [target, setTarget] = useState<{ backLabel: string; backHref: string }>(
    { backLabel: 'Terminal', backHref: '/terminal' }
  );

  useEffect(() => {
    const ref = backHrefFromReferrer();
    if (ref === '/map' || ref === '/moon' || ref.startsWith('/moon')) {
      setTarget({ backLabel: 'Map', backHref: '/map' });
    } else if (ref === '/watchlist') {
      setTarget({ backLabel: 'Watchlist', backHref: '/watchlist' });
    } else {
      setTarget({ backLabel: 'Terminal', backHref: '/terminal' });
    }
  }, []);

  return target;
}

function backHrefFromReferrer(): string {
  if (typeof document === 'undefined') return '/terminal';
  try {
    const url = new URL(document.referrer);
    if (url.origin !== window.location.origin) return '/terminal';
    return url.pathname;
  } catch {
    return '/terminal';
  }
}

function CopyIcon() {
  return (
    <svg
      aria-hidden
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
