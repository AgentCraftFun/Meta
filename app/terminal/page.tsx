'use client';

import ChainAndNarrativeRail from '@/components/terminal/ChainAndNarrativeRail';
import NarrativeFeed from '@/components/terminal/NarrativeFeed';
import TokenTable from '@/components/terminal/TokenTable';
import NarrativeFeedSimulator from '@/components/earth/NarrativeFeedSimulator';
import LiveFeedSimulator from '@/components/moon/LiveFeedSimulator';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';

/**
 * MetaMap Terminal — density-first product surface. The global TopBar
 * (mounted in app/layout.tsx) owns the wordmark / view switcher /
 * search / status; this page only renders the three-column body.
 *
 * pt-12 reserves the 48px the fixed TopBar occupies. h-screen on the
 * outer means the three columns share `100vh - 48px` evenly.
 */
export default function TerminalPage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ds-bg-base text-ds-text-primary pt-12">
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

      <NarrativeFeedSimulator />
      <LiveFeedSimulator />
      <KeyboardShortcuts />
    </div>
  );
}
