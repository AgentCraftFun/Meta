'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import MobileGate from '@/components/hud/MobileGate';
import MoonModeBadge from '@/components/hud/MoonModeBadge';
import MoonStatusOverlay from '@/components/hud/MoonStatusOverlay';
import SurfaceToggle from '@/components/hud/SurfaceToggle';
import TopBar from '@/components/hud/TopBar';
import LiveFeedSimulator from '@/components/moon/LiveFeedSimulator';
import MoonLeftHud from '@/components/moon/MoonLeftHud';
import TokenList from '@/components/moon/TokenList';
import TokenSidePanel from '@/components/moon/TokenSidePanel';

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

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <MoonScene />
      <TopBar suffix="Moon" />
      <SurfaceToggle />
      <MoonLeftHud />
      <TokenList />
      <TokenSidePanel />
      <MoonStatusOverlay />
      <MoonModeBadge />
      <KeyboardShortcuts />
      <MobileGate />
      {/* Headless — fabricates new-pair / volume-spike / new-high events
          on a random interval, pauses while tab is hidden. */}
      <LiveFeedSimulator />
    </main>
  );
}
