'use client';

import { useEffect, useRef } from 'react';
import ChainAndNarrativeRail from '@/components/terminal/ChainAndNarrativeRail';
import NarrativeFeed from '@/components/terminal/NarrativeFeed';
import TerminalTopBar from '@/components/terminal/TerminalTopBar';
import TokenTable from '@/components/terminal/TokenTable';
import NarrativeFeedSimulator from '@/components/earth/NarrativeFeedSimulator';
import LiveFeedSimulator from '@/components/moon/LiveFeedSimulator';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';

/**
 * MetaMap Terminal — three-column, density-first product surface. The
 * earlier Earth/Moon scenes stay routed at `/` and `/moon` for now;
 * the global-search top bar will surface a default-route toggle in
 * the next sprint.
 *
 * Hidden no-op input lives at the page root so the `/` and ⌘K
 * shortcuts can target a focusable element. Replaced by the real
 * search input in the next sprint.
 */
export default function TerminalPage() {
  const hiddenSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Expose for KeyboardShortcuts' / and ⌘K handlers without bolting
    // a ref through the React tree.
    (window as unknown as { __metamapSearchFocus?: () => void }).__metamapSearchFocus =
      () => {
        hiddenSearchRef.current?.focus();
        console.log('[terminal] focus stub search input');
      };
    return () => {
      (window as unknown as { __metamapSearchFocus?: () => void }).__metamapSearchFocus =
        undefined;
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ds-bg-base text-ds-text-primary">
      <TerminalTopBar />

      <div className="flex flex-1 min-h-0">
        <aside
          className="w-[220px] shrink-0 border-r border-ds-border-subtle"
          aria-label="Filters rail"
        >
          <ChainAndNarrativeRail />
        </aside>

        <main className="min-w-0 flex-1" aria-label="Token table">
          <TokenTable />
        </main>

        <aside
          className="w-[320px] shrink-0 border-l border-ds-border-subtle"
          aria-label="Live narrative feed"
        >
          <NarrativeFeed />
        </aside>
      </div>

      <input
        ref={hiddenSearchRef}
        type="search"
        aria-label="Global search (coming soon)"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
      />

      {/* Reuse the existing headless simulators so the narrative feed
          stays live without a network round-trip. */}
      <NarrativeFeedSimulator />
      <LiveFeedSimulator />
      <KeyboardShortcuts />
    </div>
  );
}
