'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatUtcClock } from '@/lib/time';

/**
 * Placeholder 48px top chrome. The real top bar — global search,
 * surface toggle, account menu — lands in the next sprint. This shim
 * keeps the layout heights correct and surfaces the in-app shortcuts
 * (1 / 2 / 3) so users can find their way back to the other views.
 */
export default function TerminalTopBar() {
  const [clock, setClock] = useState('');
  useEffect(() => {
    setClock(formatUtcClock());
    const id = setInterval(() => setClock(formatUtcClock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      role="banner"
      className="flex h-12 shrink-0 items-center gap-ds5 border-b border-ds-border-subtle bg-ds-bg-base px-ds5 font-ds-mono"
    >
      <div className="flex items-baseline gap-ds3">
        <span className="text-[13px] font-semibold uppercase tracking-[0.4em] text-ds-text-primary">
          MetaMap
        </span>
        <span aria-hidden className="text-ds-text-tertiary">/</span>
        <span className="text-[10px] uppercase tracking-[0.4em] text-ds-accent-cyan">
          Terminal
        </span>
      </div>

      <nav aria-label="Surface navigation" className="ml-ds4 flex items-center gap-ds2">
        <NavLink href="/terminal" active label="Terminal" hotkey="1" />
        <NavLink href="/" label="Map" hotkey="2" />
        <NavLink href="/watchlist" label="Watchlist" hotkey="3" />
      </nav>

      <div
        data-numeric="true"
        className="ml-auto text-[10px] tabular-nums tracking-[0.3em] text-ds-text-tertiary"
        aria-label="Current UTC time"
      >
        {clock || '—— : —— : —— UTC'}
      </div>
    </header>
  );
}

function NavLink({
  href,
  active = false,
  label,
  hotkey,
}: {
  href: string;
  active?: boolean;
  label: string;
  hotkey: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'inline-flex h-7 items-center gap-ds2 rounded-ds-sm px-ds3 text-[10px] uppercase tracking-[0.32em] transition-colors duration-ds-fast ease-ds-standard',
        active
          ? 'bg-ds-accent-cyan/15 text-ds-accent-cyan'
          : 'text-ds-text-secondary hover:bg-ds-bg-surface hover:text-ds-text-primary',
      ].join(' ')}
    >
      {label}
      <kbd
        aria-hidden
        className="rounded-ds-sm border border-ds-border-strong bg-ds-bg-surfaceHi px-[5px] text-[8px] text-ds-text-tertiary"
      >
        {hotkey}
      </kbd>
    </Link>
  );
}
