'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import CanvasA11yAnnouncer from '@/components/celestial/CanvasA11yAnnouncer';
import CanvasFilterChips from '@/components/celestial/CanvasFilterChips';
import SceneLegend from '@/components/celestial/SceneLegend';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import MobileGate from '@/components/hud/MobileGate';
import MoonStatusOverlay from '@/components/hud/MoonStatusOverlay';
import SurfaceToggle from '@/components/hud/SurfaceToggle';
import LiveFeedSimulator from '@/components/moon/LiveFeedSimulator';
import MoonLeftHud from '@/components/moon/MoonLeftHud';
import TokenList from '@/components/moon/TokenList';
import TokenSidePanel from '@/components/moon/TokenSidePanel';
import { useCarryoverHandoff } from '@/lib/useCarryoverHandoff';

const MoonScene = dynamic(() => import('@/components/moon/MoonScene'), {
  ssr: false,
  loading: () => <Loader />,
});

function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3 font-mono">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-neon-cyan/80">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
          Initializing MetaMap…
        </div>
      </div>
    </div>
  );
}

export default function MoonPage() {
  useEffect(() => {
    document.body.classList.add('viewer-mode');
    return () => {
      document.body.classList.remove('viewer-mode');
    };
  }, []);

  // Earth → Moon carryover: applies narrativeIds during the hold
  // phase so the craters arrive scoped to the carried narrative.
  useCarryoverHandoff('moon');

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <MoonScene />
      <SurfaceToggle />
      <MoonLeftHud />
      <TokenList />
      <TokenSidePanel />
      <MoonStatusOverlay />
      <CanvasFilterChips surface="moon" />
      <SceneLegend surface="moon" />
      <CanvasA11yAnnouncer surface="moon" />
      <KeyboardShortcuts />
      <MobileGate />
      <LiveFeedSimulator />
    </main>
  );
}
