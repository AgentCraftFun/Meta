'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import CanvasA11yAnnouncer from '@/components/celestial/CanvasA11yAnnouncer';
import CanvasFilterChips from '@/components/celestial/CanvasFilterChips';
import SceneLegend from '@/components/celestial/SceneLegend';
import EarthLeftHud from '@/components/earth/EarthLeftHud';
import HighImpactSoundCue from '@/components/earth/HighImpactSoundCue';
import NarrativeFeedSimulator from '@/components/earth/NarrativeFeedSimulator';
import NarrativeRankList from '@/components/earth/NarrativeRankList';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import SidePanel from '@/components/hud/SidePanel';
import SpeakerToggle from '@/components/hud/SpeakerToggle';
import SurfaceToggle from '@/components/hud/SurfaceToggle';
import { useCarryoverHandoff } from '@/lib/useCarryoverHandoff';

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

  // Pre-apply Moon → Earth carryover (country + narrative) during the
  // cinematic transition's hold phase so the camera tween lands on
  // the right country the moment the canvas appears.
  useCarryoverHandoff('earth');

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <EarthScene />
      <SpeakerToggle />
      <SurfaceToggle />
      <EarthLeftHud />
      <NarrativeRankList />
      <SidePanel />
      <CanvasFilterChips surface="earth" />
      <SceneLegend surface="earth" />
      <CanvasA11yAnnouncer surface="earth" />
      <KeyboardShortcuts />
      <NarrativeFeedSimulator />
      <HighImpactSoundCue />
    </main>
  );
}
