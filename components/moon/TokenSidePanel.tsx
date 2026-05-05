'use client';

import { useMemo, useState } from 'react';
import {
  formatAge,
  formatPercent,
  formatUsd,
  shortAddress,
} from '@/lib/format';
import { useMetaStore } from '@/lib/store';
import type { HeatLevel, Token } from '@/lib/types/token';
import { useTokens } from '@/lib/useTokens';

const HEAT_HEX: Record<HeatLevel, string> = {
  hot: '#ef4444',
  warm: '#fbbf24',
  emerging: '#e5e7eb',
};

const CHAIN_LABEL: Record<Token['chain'], string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  base: 'Base',
  other: 'Other',
};

export default function TokenSidePanel() {
  const window = useMetaStore((s) => s.timeWindow);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const { data } = useTokens(window);

  const token = useMemo(() => {
    if (!selectedTokenId || !data) return null;
    return data.tokens.find((t) => t.id === selectedTokenId) ?? null;
  }, [data, selectedTokenId]);

  const open = !!token;

  return (
    <aside
      aria-hidden={!open}
      className={[
        'pointer-events-auto fixed right-0 top-0 z-40 flex h-full w-[420px] flex-col border-l border-neon-cyan/15 bg-black/55 font-mono backdrop-blur-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
      style={{ boxShadow: open ? '0 0 60px rgba(94,240,255,0.06)' : 'none' }}
    >
      {token && <PanelBody token={token} onClose={() => setSelectedToken(null)} />}
    </aside>
  );
}

function PanelBody({
  token,
  onClose,
}: {
  token: Token;
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
                  key={tag}
                  className="rounded-sm border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-cyan-300"
                >
                  {tag}
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
