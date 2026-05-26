'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import TerminalTopBar from '@/components/terminal/TerminalTopBar';

/**
 * Stub — token detail page (chart, tx feed, holders, source tweets,
 * narrative timeline) ships in the next-next sprint. Routed now so
 * row clicks + Enter from the Terminal land somewhere readable.
 */
export default function TokenDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ds-bg-base text-ds-text-primary">
      <TerminalTopBar />
      <main className="flex flex-1 flex-col items-center justify-center gap-ds3 font-ds-mono">
        <p className="text-[11px] uppercase tracking-[0.4em] text-ds-text-tertiary">
          Token detail
        </p>
        <p className="text-[14px] text-ds-text-secondary">
          <span className="text-ds-text-primary">{decodeURIComponent(id)}</span>{' '}
          — full detail page ships next sprint.
        </p>
        <Link
          href="/terminal"
          className="mt-ds2 rounded-ds-sm border border-ds-border-strong px-ds4 py-ds2 text-[10px] uppercase tracking-[0.32em] text-ds-text-primary hover:border-ds-accent-cyan/60 hover:text-ds-accent-cyan"
        >
          Back to Terminal
        </Link>
      </main>
      <KeyboardShortcuts />
    </div>
  );
}
