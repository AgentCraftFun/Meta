'use client';

import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Decode from '@/components/sitenew/Decode';
import FadeUp from '@/components/sitenew/FadeUp';
import SectionLabel from '@/components/sitenew/SectionLabel';
import Shimmer from '@/components/sitenew/Shimmer';
import TacticalFrame from '@/components/sitenew/TacticalFrame';
import {
  getSpcxRewards,
  isAddress,
  SPCX_ADDRESS,
  TrackerError,
  type SpcxRewards,
} from './lib/spcx';

type Status = 'idle' | 'loading' | 'success' | 'error';

const UNISWAP = 'https://app.uniswap.org';
const ETHERSCAN_TOKEN = `https://etherscan.io/token/${SPCX_ADDRESS}`;

// Dark frosted-glass fill for cards floating over the bright planet — keeps the
// mars-glass blur (live planet behind) but dims it enough for readable text.
const DARK_GLASS =
  'linear-gradient(155deg, rgba(18,24,40,0.84) 0%, rgba(8,12,22,0.9) 100%)';

/* ---------- formatting helpers ---------- */

function fmtAmount(n: number): string {
  if (n === 0) return '0';
  const max = n >= 1000 ? 2 : n >= 1 ? 4 : 6;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: max }).format(n);
}

function fmtUsd(n: number): string {
  if (n > 0 && n < 0.01) return '<$0.01';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1000 ? 2 : 0,
  });
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function friendlyError(err: unknown): string {
  if (err instanceof TrackerError) {
    if (err.code === 'INVALID_ADDRESS')
      return 'That does not look like a wallet address. Paste a full 0x… Ethereum address.';
    if (err.code === 'NO_CONTRACT')
      return 'The $SPCX contract is not returning data right now. Try again shortly.';
    return 'Could not reach an Ethereum node. Check your connection and try again.';
  }
  return 'Something went wrong reading the chain. Try again.';
}

/* ---------- count-up number ---------- */

function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return <>{format(display)}</>;
}

/* ---------- main ---------- */

export default function TrackerConsole() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<SpcxRewards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const valid = isAddress(address);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const value = address.trim();
    if (!isAddress(value)) {
      setStatus('error');
      setError('That does not look like a wallet address. Paste a full 0x… Ethereum address.');
      setData(null);
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const result = await getSpcxRewards(value);
      setData(result);
      setStatus('success');
    } catch (err) {
      setError(friendlyError(err));
      setData(null);
      setStatus('error');
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddress(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard blocked — no-op; the user can paste manually.
      inputRef.current?.focus();
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[860px]">
      {/* Heading */}
      <div className="text-center">
        <FadeUp>
          <SectionLabel index="◎" label="Rewards Tracker" align="center" />
        </FadeUp>
        <Decode className="mt-7">
          <h1
            className="font-display text-[52px] font-bold leading-[1.02] tracking-[-0.035em] text-white md:text-[76px]"
            style={{ textShadow: '0 2px 30px rgba(2,4,9,0.55)' }}
          >
            Track your <Shimmer>$SPCX</Shimmer> rewards.
          </h1>
        </Decode>
        <FadeUp delay={0.12}>
          <p
            className="mx-auto mt-7 max-w-[600px] text-[17px] leading-relaxed text-slate-200 md:text-[19px]"
            style={{ textShadow: '0 1px 16px rgba(2,4,9,0.85)' }}
          >
            Paste any wallet to see the $SPCX it has accrued.
          </p>
        </FadeUp>
      </div>

      {/* Console card */}
      <FadeUp delay={0.2} className="mt-14">
        <TacticalFrame color="rgb(var(--accent-400) / 0.6)" size={18} thickness={1.5}>
          <form
            onSubmit={check}
            className="relative p-7 mars-glass md:p-9"
            style={{ background: DARK_GLASS }}
          >
            <div className="flex items-center justify-between">
              <label
                htmlFor="wallet"
                className="font-mono text-[12px] uppercase tracking-[0.42em] text-accent-300"
              >
                Wallet address
              </label>
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="font-mono text-[11px] uppercase tracking-[0.32em] text-slate-300 transition-colors hover:text-accent-300"
              >
                Paste
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="wallet"
                ref={inputRef}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (status === 'error') {
                    setStatus('idle');
                    setError(null);
                  }
                }}
                spellCheck={false}
                autoComplete="off"
                inputMode="text"
                placeholder="0x0000000000000000000000000000000000000000"
                aria-invalid={status === 'error'}
                className={`w-full flex-1 rounded-sm border bg-[#06090F]/85 px-5 py-5 font-mono text-[15px] tracking-wide text-white outline-none transition-colors placeholder:text-slate-600 focus:border-accent-300 focus:shadow-[0_0_0_1px_rgb(var(--accent-300)_/_0.45)] ${
                  valid ? 'border-accent-300/60' : 'border-accent-400/25'
                }`}
              />
              <SubmitButton loading={status === 'loading'} />
            </div>

            {/* Inline error */}
            <div aria-live="polite" className="min-h-[20px]">
              <AnimatePresence mode="wait">
                {status === 'error' && error && (
                  <motion.p
                    key={error}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center gap-2 font-mono text-[12px] text-red-300/90"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        </TacticalFrame>
      </FadeUp>

      {/* Results */}
      <AnimatePresence mode="wait">
        {status === 'success' && data && (
          <motion.div
            key={data.wallet}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8"
          >
            {data.amount > 0 ? <RewardsResult data={data} /> : <EmptyResult data={data} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust footer */}
      <p className="mt-12 text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.3em] text-slate-400">
        Reads live from Ethereum mainnet · contract{' '}
        <a
          href={ETHERSCAN_TOKEN}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-300"
        >
          {shortAddr(SPCX_ADDRESS)}
        </a>
      </p>
    </div>
  );
}

/* ---------- submit button (armed, on-brand) ---------- */

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border border-accent-400/70 px-9 py-5 font-mono text-[14px] uppercase tracking-[0.3em] text-accent-300 transition-colors duration-200 hover:border-accent-300 hover:text-[#05080F] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-accent-300 sm:py-0"
    >
      {/* Fill wipe left → right on hover */}
      <span className="absolute inset-0 origin-left scale-x-0 bg-accent-300 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? (
          <>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-300" />
            Scanning
          </>
        ) : (
          <>
            Check rewards
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </>
        )}
      </span>
    </button>
  );
}

/* ---------- results: holder ---------- */

function RewardsResult({ data }: { data: SpcxRewards }) {
  return (
    <TacticalFrame color="rgb(var(--accent-400) / 0.55)" size={18} thickness={1.5}>
      <div
        className="relative overflow-hidden p-8 mars-glass md:p-10"
        style={{ background: DARK_GLASS }}
      >
        {/* Hero number */}
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.4em] text-accent-300/85">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-300 shadow-[0_0_10px_rgb(var(--accent-400)_/_0.85)]" />
          $SPCX accrued
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-display text-[68px] font-bold leading-none tracking-[-0.03em] text-white md:text-[96px]">
            <CountUp value={data.amount} format={fmtAmount} />
          </span>
          <span className="font-display text-[26px] font-bold tracking-[-0.01em] text-accent-300 md:text-[34px]">
            SPCX
          </span>
        </div>
        <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-slate-300">
          Reflected to{' '}
          <span className="font-mono text-slate-300">{shortAddr(data.wallet)}</span> on-chain.
          More $SPCX lands automatically on every $STAR trade.
        </p>

        {/* Stat strip */}
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/5 bg-white/5 sm:grid-cols-2">
          <Stat
            label="Total distributed (USD)"
            value={data.totalDistributedUsd != null ? fmtUsd(data.totalDistributedUsd) : '—'}
          />
          <Stat
            label="Total $SPCX distributed"
            value={data.totalDistributed != null ? fmtAmount(data.totalDistributed) : '—'}
          />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={`${ETHERSCAN_TOKEN}?a=${data.wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-300 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-200"
          >
            View on Etherscan →
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Verified · Ethereum mainnet
          </span>
        </div>
      </div>
    </TacticalFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0B1220]/90 p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.36em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 font-display text-[26px] font-bold tracking-[-0.01em] text-white">
        {value}
      </div>
    </div>
  );
}

/* ---------- results: empty (no rewards yet) ---------- */

function EmptyResult({ data }: { data: SpcxRewards }) {
  return (
    <TacticalFrame color="rgb(var(--accent-400) / 0.4)" size={18} thickness={1.5}>
      <div
        className="relative overflow-hidden p-8 mars-glass md:p-10"
        style={{ background: DARK_GLASS }}
      >
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.4em] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          No distributions yet
        </div>
        <h3 className="mt-4 font-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-white md:text-[38px]">
          This wallet hasn&apos;t accrued any $SPCX.
        </h3>
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-slate-300">
          We checked{' '}
          <span className="font-mono text-slate-300">{shortAddr(data.wallet)}</span> on Ethereum
          and found a 0 $SPCX balance. Rewards land in $STAR holder wallets
          automatically on every buy and sell. Hold at least 1,000 $STAR to
          start stacking $SPCX.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={UNISWAP}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-sm border border-accent-400/70 px-6 py-3 font-mono text-[12px] uppercase tracking-[0.3em] text-accent-300 transition-colors hover:border-accent-300"
          >
            Get $STAR
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </a>
          <a
            href={`${ETHERSCAN_TOKEN}?a=${data.wallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 underline decoration-accent-400/30 underline-offset-4 transition-colors hover:text-accent-300"
          >
            View on Etherscan →
          </a>
        </div>
      </div>
    </TacticalFrame>
  );
}
