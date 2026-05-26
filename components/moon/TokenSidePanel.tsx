'use client';

import { useMemo, useState } from 'react';
import {
  formatAge,
  formatPercent,
  formatUsd,
  shortAddress,
} from '@/lib/format';
import { useMetaStore } from '@/lib/store';
import type { LiveEvent } from '@/lib/types/liveEvent';
import type { HeatLevel, Token } from '@/lib/types/token';
import { useEffectiveTokens } from '@/lib/useEffectiveTokens';

const HEAT_HEX: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#e5e7eb',
};

const CHAIN_LABEL: Record<Token['chain'], string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  base: 'Base',
  bsc: 'BSC',
  other: 'Other',
};

export default function TokenSidePanel() {
  const window = useMetaStore((s) => s.timeWindow);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const universe = useEffectiveTokens(window);
  const liveEvents = useMetaStore((s) => s.liveEvents);

  const token = useMemo(() => {
    if (!selectedTokenId) return null;
    return universe.find((t) => t.id === selectedTokenId) ?? null;
  }, [universe, selectedTokenId]);

  const recentEvents = useMemo(() => {
    if (!selectedTokenId) return [] as LiveEvent[];
    return liveEvents.filter((e) => e.tokenId === selectedTokenId).slice(0, 5);
  }, [liveEvents, selectedTokenId]);

  const open = !!token;

  return (
    <aside
      aria-hidden={!open}
      className={[
        'pointer-events-auto fixed right-0 top-12 z-40 flex h-[calc(100vh-48px)] w-[420px] flex-col border-l border-neon-cyan/15 bg-black/55 font-mono backdrop-blur-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
      style={{ boxShadow: open ? '0 0 60px rgba(94,240,255,0.06)' : 'none' }}
    >
      {token && (
        <PanelBody
          token={token}
          recentEvents={recentEvents}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </aside>
  );
}

function PanelBody({
  token,
  recentEvents,
  onClose,
}: {
  token: Token;
  recentEvents: LiveEvent[];
  onClose: () => void;
}) {
  const heat = HEAT_HEX[token.category];
  const up = token.priceChange24h >= 0;
  const [copied, setCopied] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: heat, boxShadow: `0 0 10px ${heat}` }}
        />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
            Token
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[22px] font-bold uppercase tracking-[0.04em] text-white">
              {token.symbol}
            </span>
            <span className="truncate text-[11px] text-white/45">
              {token.name}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-white/55 transition-colors hover:border-white/30 hover:text-white"
          onClick={onClose}
          aria-label="Close token panel"
        >
          ×
        </button>
      </div>

      {/* Recent events — live timeline of activity for this token */}
      <RecentEvents events={recentEvents} />

      {/* Chart — DexScreener iframe when we have a viable address; mock
          placeholder otherwise. */}
      <DexscreenerChart token={token} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px border-b border-white/8 bg-white/5">
        <Stat label="Market Cap" value={formatUsd(token.marketCap)} />
        <Stat label="Volume (24H)" value={formatUsd(token.volume24h)} />
        <Stat label="Price" value={formatUsd(token.priceUsd)} />
        <Stat
          label="24H Change"
          value={formatPercent(token.priceChange24h)}
          tone={up ? 'pos' : 'neg'}
        />
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <Section title="Narrative Tags">
          <div className="flex flex-wrap gap-1.5">
            {token.narrativeTags.length === 0 ? (
              <span className="text-[11px] text-white/35">— none —</span>
            ) : (
              token.narrativeTags.map((tag) => (
                <span
                  key={tag.id}
                  title={
                    tag.countryISO
                      ? `${tag.label} · ${tag.countryISO}`
                      : tag.label
                  }
                  className="rounded-sm border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300"
                >
                  {tag.label}
                </span>
              ))
            )}
          </div>
        </Section>

        <Section title="Origin">
          <div className="flex items-center gap-3 text-[12px] text-white/85">
            <span className="rounded-sm border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.28em]">
              {CHAIN_LABEL[token.chain]}
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/45">
              {formatAge(token.age)} since launch
            </span>
          </div>
        </Section>

        {token.contractAddress && (
          <Section title="Contract">
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-mono text-[11px] text-white/70">
                {shortAddress(token.contractAddress, 6, 6)}
              </span>
              <button
                type="button"
                className="rounded-sm border border-white/15 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.3em] text-white/65 transition-colors hover:border-white/30 hover:text-white"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      token.contractAddress ?? ''
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    /* noop */
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </Section>
        )}

        <Section title="Source">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            {token.source.toUpperCase()}
          </div>
        </Section>

        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 border border-cyan-400/40 bg-cyan-400/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.36em] text-cyan-300 transition-colors hover:bg-cyan-400/15 hover:text-cyan-200"
          onClick={() => {
            // Placeholder — wire to dexscreener URL once contractAddress is real.
            console.warn('[token-panel] dexscreener integration pending');
          }}
        >
          View on Dexscreener
          <span aria-hidden>↗</span>
        </button>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg';
}) {
  const colour =
    tone === 'pos' ? 'text-emerald-300' : tone === 'neg' ? 'text-rose-300' : 'text-white';
  return (
    <div className="flex flex-col gap-1 bg-[#06090F] px-4 py-3">
      <span className="text-[9px] uppercase tracking-[0.32em] text-white/40">
        {label}
      </span>
      <span className={`text-[15px] font-semibold tabular-nums ${colour}`}>
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 text-[9px] uppercase tracking-[0.4em] text-white/35">
        {title}
      </div>
      {children}
    </div>
  );
}

/** DexScreener URL slugs the public site recognises today. */
const DEX_CHAIN_SLUG: Record<Token['chain'], string | null> = {
  ethereum: 'ethereum',
  solana: 'solana',
  base: 'base',
  bsc: 'bsc',
  other: null,
};

/**
 * Embeds DexScreener's pair widget at the top of the panel when we have
 * both a chain slug and a contract address. Mock data won't always
 * resolve to a real pair — DexScreener returns its own empty state in
 * that case. When chain is 'other' or no address, render the project
 * placeholder so the layout never collapses.
 */
const EVENT_LABEL_SHORT: Record<LiveEvent['type'], string> = {
  'new-pair': 'New Pair',
  'volume-spike': 'Vol Spike',
  'new-high': 'New High',
};
const EVENT_ACCENT_SHORT: Record<LiveEvent['type'], string> = {
  'new-pair': '#fbbf24',
  'volume-spike': '#22D3EE',
  'new-high': '#34d399',
};

function RecentEvents({ events }: { events: LiveEvent[] }) {
  return (
    <div className="border-b border-white/8 bg-[#06090F] px-5 pb-3 pt-4">
      <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.4em] text-white/35">
        <span>Recent Events</span>
        <span className="text-white/25">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="text-[10px] uppercase tracking-[0.32em] text-white/30">
          — none yet —
        </div>
      ) : (
        <ol className="flex flex-col gap-1">
          {events.map((e) => {
            const accent = EVENT_ACCENT_SHORT[e.type];
            const seconds = Math.max(0, Math.floor((Date.now() - e.timestamp) / 1000));
            const ago =
              seconds < 60
                ? `${seconds}s`
                : seconds < 3600
                  ? `${Math.floor(seconds / 60)}m`
                  : `${Math.floor(seconds / 3600)}h`;
            return (
              <li
                key={e.id}
                className="flex items-center gap-2 rounded-sm border-l-2 bg-black/30 px-2 py-1.5"
                style={{ borderLeftColor: accent }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: accent }}
                />
                <span
                  className="text-[9px] uppercase tracking-[0.32em]"
                  style={{ color: accent }}
                >
                  {EVENT_LABEL_SHORT[e.type]}
                </span>
                <span className="ml-auto text-[9px] tracking-[0.2em] text-white/35 tabular-nums">
                  {ago} ago
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function DexscreenerChart({ token }: { token: Token }) {
  const slug = DEX_CHAIN_SLUG[token.chain];
  const canEmbed = slug && token.contractAddress;
  return (
    <div className="border-b border-white/8 bg-[#06090F] px-3 pb-3 pt-3">
      <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.4em] text-white/35">
        <span>Live chart</span>
        <span className="text-white/25">DEXScreener</span>
      </div>
      {canEmbed ? (
        <iframe
          src={`https://dexscreener.com/${slug}/${token.contractAddress}?embed=1&theme=dark&info=0&trades=0`}
          title={`${token.symbol} chart`}
          className="block h-[280px] w-full rounded-sm border border-[#1E293B]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-[280px] w-full items-center justify-center rounded-sm border border-[#1E293B] bg-[#0B1220] text-center text-[10px] uppercase tracking-[0.36em] text-white/35">
          Chart unavailable · Mock data
        </div>
      )}
    </div>
  );
}
