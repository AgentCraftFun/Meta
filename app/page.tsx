import dynamic from 'next/dynamic';
import SourceModeBadge from '@/components/hud/SourceModeBadge';
import SidePanel from '@/components/hud/SidePanel';
import Ticker from '@/components/hud/Ticker';
import TimeToggle from '@/components/hud/TimeToggle';
import TopBar from '@/components/hud/TopBar';

const Stage = dynamic(() => import('@/components/globe/Stage'), {
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
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <Stage />
      <TopBar />
      <TimeToggle />
      <SidePanel />
      <Ticker />
      <SourceModeBadge />
    </main>
  );
}
