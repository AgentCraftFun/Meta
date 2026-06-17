'use client';

import { useState } from 'react';

/** Starship Protocol ($STAR) — the ERC-20 token contract on Ethereum. */
export const STAR_CONTRACT = '0x7e4e1af275bffbe00c7d823f4868c27facf26459';
const ETHERSCAN = `https://etherscan.io/token/${STAR_CONTRACT}`;
const X_URL = 'https://x.com/StarShipEVM';
const TG_URL = 'https://t.me/StarShipEvm';

/**
 * Social links + the copyable $STAR contract address. Used in the /siteMARS
 * final CTA and the /MarsTracker footer so the CA + community are reachable
 * from anywhere on the site. Click the chip to copy; Etherscan is the fallback.
 */
export default function SiteLinks() {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(STAR_CONTRACT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the Etherscan link is the fallback */
    }
  };

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-5">
      {/* Community */}
      <div className="flex items-center gap-3">
        <IconLink href={X_URL} label="Starship Protocol on X">
          <XIcon />
        </IconLink>
        <IconLink href={TG_URL} label="Starship Protocol on Telegram">
          <TelegramIcon />
        </IconLink>
      </div>

      {/* Contract — click to copy */}
      <div className="w-full">
        <div className="mb-2 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.45em] text-accent-400/70">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
          $STAR Contract
        </div>
        <button
          type="button"
          onClick={onCopy}
          title="Copy contract address"
          aria-label={`Copy $STAR contract address ${STAR_CONTRACT}`}
          className="group flex w-full items-center justify-between gap-3 border border-accent-400/30 bg-[#0B1220]/70 px-4 py-3 text-left transition-colors hover:border-accent-400/60 hover:bg-[#111A2E]/80"
        >
          <span className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-slate-200 md:text-[13px]">
            {STAR_CONTRACT}
          </span>
          <span className="flex flex-shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-300">
            {copied ? (
              <>
                <CheckIcon /> Copied
              </>
            ) : (
              <>
                <CopyIcon /> Copy
              </>
            )}
          </span>
        </button>
        <a
          href={ETHERSCAN}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400 transition-colors hover:text-accent-300"
        >
          View on Etherscan ↗
        </a>
      </div>
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center border border-accent-400/30 bg-[#0B1220]/60 text-slate-300 transition-all hover:border-accent-400/70 hover:bg-[#111A2E]/80 hover:text-accent-200"
    >
      {children}
    </a>
  );
}

function XIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15V5a1 1 0 0 1 1-1h9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
