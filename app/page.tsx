'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import EarthLeftHud from '@/components/earth/EarthLeftHud';
import NarrativeFeedSimulator from '@/components/earth/NarrativeFeedSimulator';
import NarrativeRankList from '@/components/earth/NarrativeRankList';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import MobileGate from '@/components/hud/MobileGate';
import SidePanel from '@/components/hud/SidePanel';
import SourceModeBadge from '@/components/hud/SourceModeBadge';
import SpeakerToggle from '@/components/hud/SpeakerToggle';
import SurfaceToggle from '@/components/hud/SurfaceToggle';
import TopBar from '@/components/hud/TopBar';

const EarthScene = dynamic(() => import('@/components/earth/EarthScene'), {
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

export default function Page() {
  useEffect(() => {
    document.body.classList.add('viewer-mode');
    return () => {
      document.body.classList.remove('viewer-mode');
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <EarthScene />
      <TopBar />
      <SpeakerToggle />
      <SurfaceToggle />
      <EarthLeftHud />
      <NarrativeRankList />
      <SidePanel />
      <SourceModeBadge />
      <KeyboardShortcuts />
      <MobileGate />
      {/* Headless — fabricates new-story / momentum-shift / cross-country
          events on a 4-8s interval, pauses while the tab is hidden. */}
      <NarrativeFeedSimulator />
    </main>
  );
}
