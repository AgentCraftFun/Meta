'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import KeyboardShortcuts from '@/components/hud/KeyboardShortcuts';
import MobileGate from '@/components/hud/MobileGate';
import SourceModeBadge from '@/components/hud/SourceModeBadge';
import SurfaceToggle from '@/components/hud/SurfaceToggle';
import TopBar from '@/components/hud/TopBar';

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
      <TopBar />
      <SurfaceToggle />

      {/* Phase A scaffolding banner */}
      <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 font-mono text-center">
          <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.45em] text-neon-cyan/85">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan shadow-neon-cyan" />
            Moon · Scaffolding · Phase A
          </span>
          <h1 className="font-display text-[64px] font-bold uppercase tracking-[0.04em] text-white/85">
            Moon
          </h1>
          <p className="max-w-[420px] text-[12px] uppercase tracking-[0.32em] text-white/45">
            Token galaxy / arrives Phase B
          </p>
        </div>
      </div>

      <SourceModeBadge />
      <KeyboardShortcuts />
      <MobileGate />
    </main>
  );
}
