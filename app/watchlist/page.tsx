'use client';

import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import TerminalTopBar from '@/components/terminal/TerminalTopBar';
import Link from 'next/link';

/**
 * Stub — the real watchlist (saved tokens + price alerts + custom
 * narrative subscriptions) lands two sprints out. Keeping it routed
 * so the Terminal nav and the `3` hotkey have somewhere to go.
 */
export default function WatchlistPage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ds-bg-base text-ds-text-primary">
      <TerminalTopBar />
      <main className="flex flex-1 items-center justify-center font-ds-mono">
        <div className="flex max-w-[420px] flex-col items-center gap-ds3 text-center">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ds-text-tertiary">
            Watchlist
          </p>
          <p className="text-[14px] leading-relaxed text-ds-text-secondary">
            Star tokens in the Terminal to watch them here. Custom narrative
            subscriptions ship in the next sprint.
          </p>
          <Link
            href="/terminal"
            className="mt-ds2 rounded-ds-sm border border-ds-border-strong px-ds4 py-ds2 text-[10px] uppercase tracking-[0.32em] text-ds-text-primary hover:border-ds-accent-cyan/60 hover:text-ds-accent-cyan"
          >
            Open Terminal
          </Link>
        </div>
      </main>
      <KeyboardShortcuts />
    </div>
  );
}
